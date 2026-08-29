import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  allowedValues?: Set<string>
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  allowedValues,
}) => {
  const filteredOptions = (option.values ?? [])
    .map((v) => v.value)
    .filter((value) => !allowedValues || allowedValues.has(value))

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm text-ink-muted">Select {title}</span>
      <div className="flex flex-wrap gap-2" data-testid={dataTestId}>
        {filteredOptions.map((v) => {
          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border text-small-regular min-w-[4.5rem] h-10 rounded-sm px-3 transition-colors duration-300",
                {
                  "border-ink bg-night text-cream": v === current,
                  "border-black/15 hover:border-ink/40": v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
