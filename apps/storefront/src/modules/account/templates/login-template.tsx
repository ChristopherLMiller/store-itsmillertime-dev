"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import ForgotPassword from "@modules/account/components/forgot-password"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
  FORGOT_PASSWORD = "forgot-password",
}

type Props = {
  authentikEnabled?: boolean
}

const LoginTemplate = ({ authentikEnabled = false }: Props) => {
  const [currentView, setCurrentView] = useState(LOGIN_VIEW.SIGN_IN)

  return (
    <div className="w-full max-w-md shop-panel p-8 small:p-10 shop-fade-up">
      {currentView === LOGIN_VIEW.SIGN_IN && (
        <Login
          setCurrentView={setCurrentView}
          authentikEnabled={authentikEnabled}
        />
      )}
      {currentView === LOGIN_VIEW.REGISTER && (
        <Register setCurrentView={setCurrentView} />
      )}
      {currentView === LOGIN_VIEW.FORGOT_PASSWORD && (
        <ForgotPassword setCurrentView={setCurrentView} />
      )}
    </div>
  )
}

export default LoginTemplate
