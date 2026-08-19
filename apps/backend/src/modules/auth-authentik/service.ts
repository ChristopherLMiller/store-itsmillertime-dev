import type {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse,
  Logger,
} from "@medusajs/framework/types"
import {
  AbstractAuthModuleProvider,
  MedusaError,
} from "@medusajs/framework/utils"
import { createHash, randomBytes } from "crypto"

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  issuer: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

type OidcEndpoints = {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
}

const SCOPES = ["openid", "profile", "email"]

function toBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

class AuthentikAuthProviderService extends AbstractAuthModuleProvider {
  static DISPLAY_NAME = "Authentik"
  static identifier = "authentik"

  protected logger_: Logger
  protected options_: Options
  protected discovery_: Promise<OidcEndpoints> | null = null

  constructor({ logger }: InjectedDependencies, options: Options) {
    // @ts-expect-error AbstractAuthModuleProvider expects the module container as the first argument
    super(...arguments)
    this.logger_ = logger
    this.options_ = options
  }

  static validateOptions(options: Record<string, unknown>): void {
    for (const key of ["issuer", "clientId", "clientSecret", "redirectUri"]) {
      if (!options[key] || typeof options[key] !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Authentik auth provider option \`${key}\` is required.`
        )
      }
    }
  }

  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const callbackUrl =
      (data.body?.callback_url as string | undefined) ||
      this.options_.redirectUri

    const state = randomBytes(32).toString("hex")
    const codeVerifier = toBase64Url(randomBytes(32))
    const codeChallenge = toBase64Url(
      createHash("sha256").update(codeVerifier).digest()
    )

    await authIdentityProviderService.setState(state, {
      callback_url: callbackUrl,
      code_verifier: codeVerifier,
    })

    const endpoints = await this.getEndpoints()
    const params = new URLSearchParams({
      client_id: this.options_.clientId,
      response_type: "code",
      scope: SCOPES.join(" "),
      redirect_uri: callbackUrl,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    return {
      success: true,
      location: `${endpoints.authorization_endpoint}?${params.toString()}`,
    }
  }

  async register(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    return this.authenticate(data, authIdentityProviderService)
  }

  async validateCallback(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const code = data.query?.code as string | undefined
    const stateKey = data.query?.state as string | undefined

    if (!code || !stateKey) {
      return {
        success: false,
        error: "Authorization code or state is missing",
      }
    }

    const state = await authIdentityProviderService.getState(stateKey)
    if (!state) {
      return {
        success: false,
        error: "No state provided, or session expired",
      }
    }

    const callbackUrl = state.callback_url as string
    const codeVerifier = state.code_verifier as string

    try {
      const endpoints = await this.getEndpoints()
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
        client_id: this.options_.clientId,
        client_secret: this.options_.clientSecret,
        code_verifier: codeVerifier,
      })

      const tokenResponse = await fetch(endpoints.token_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: tokenParams.toString(),
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Failed to exchange code for tokens: ${errorText}`
        )
      }

      const tokenData = (await tokenResponse.json()) as {
        access_token?: string
      }
      const accessToken = tokenData.access_token

      if (!accessToken) {
        return {
          success: false,
          error: "Authentik did not return an access token",
        }
      }

      const userInfoResponse = await fetch(endpoints.userinfo_endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      })

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text()
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Failed to get Authentik user info: ${errorText}`
        )
      }

      const userInfo = (await userInfoResponse.json()) as {
        sub?: string
        email?: string
        name?: string
        given_name?: string
        family_name?: string
        preferred_username?: string
      }

      const entityId = userInfo.email || userInfo.sub
      if (!entityId) {
        return {
          success: false,
          error: "Unable to retrieve an email from Authentik",
        }
      }

      const userMetadata = {
        email: userInfo.email,
        name: userInfo.name,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        preferred_username: userInfo.preferred_username,
      }

      const providerMetadata = {
        authentik_sub: userInfo.sub,
      }

      try {
        await authIdentityProviderService.retrieve({ entity_id: entityId })
        const authIdentity = await authIdentityProviderService.update(
          entityId,
          {
            user_metadata: userMetadata,
            provider_metadata: providerMetadata,
          }
        )
        return { success: true, authIdentity }
      } catch (error) {
        const isNotFound =
          (error instanceof MedusaError &&
            error.type === MedusaError.Types.NOT_FOUND) ||
          (error instanceof Error && /not found/i.test(error.message))

        if (isNotFound) {
          const authIdentity = await authIdentityProviderService.create({
            entity_id: entityId,
            user_metadata: userMetadata,
            provider_metadata: providerMetadata,
          })
          return { success: true, authIdentity }
        }

        throw error
      }
    } catch (error) {
      this.logger_.error(`Authentik authentication error: ${String(error)}`)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to authenticate with Authentik",
      }
    }
  }

  protected async getEndpoints(): Promise<OidcEndpoints> {
    if (!this.discovery_) {
      this.discovery_ = this.discoverEndpoints()
    }

    return this.discovery_
  }

  protected async discoverEndpoints(): Promise<OidcEndpoints> {
    const issuer = this.options_.issuer.endsWith("/")
      ? this.options_.issuer
      : `${this.options_.issuer}/`
    const discoveryUrl = new URL(
      ".well-known/openid-configuration",
      issuer
    ).toString()

    const response = await fetch(discoveryUrl, {
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      this.discovery_ = null
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Failed to load Authentik OpenID configuration from ${discoveryUrl}`
      )
    }

    const config = (await response.json()) as OidcEndpoints
    if (
      !config.authorization_endpoint ||
      !config.token_endpoint ||
      !config.userinfo_endpoint
    ) {
      this.discovery_ = null
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Authentik OpenID configuration is missing required endpoints"
      )
    }

    return config
  }
}

export default AuthentikAuthProviderService
