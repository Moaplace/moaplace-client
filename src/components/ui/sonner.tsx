import { createElement } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast as sonnerToast, Toaster as Sonner, type ExternalToast, type ToasterProps } from "sonner"

const withDismiss = (fn: (message: string, options?: ExternalToast) => string | number) =>
  (message: string, options?: ExternalToast) => {
    const id = fn(message, {
      ...options,
      action: {
        label: createElement("span", { className: "text-xs font-pretendard-md text-black-400 px-2 py-1" }, "닫기"),
        onClick: () => sonnerToast.dismiss(id),
      },
    })
    return id
  }

const toast = {
  success: withDismiss(sonnerToast.success),
  error: withDismiss(sonnerToast.error),
  info: withDismiss(sonnerToast.info),
  warning: withDismiss(sonnerToast.warning),
  dismiss: sonnerToast.dismiss,
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-center"
      visibleToasts={1}
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-info" />,
        warning: <TriangleAlertIcon className="size-4 text-warning" />,
        error: <OctagonXIcon className="size-4 text-error" />,
        loading: <Loader2Icon className="size-4 animate-spin text-primary" />,
      }}
      style={
        {
          "--normal-bg": "var(--white)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-xl)",
          zIndex: 9999,
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "shadow-lg !items-center !z-[9999]",
          actionButton: "!bg-transparent !text-black-400 !p-0 !h-auto !font-normal",
          success: "!border-success/30 !bg-success-100",
          error: "!border-error/30 !bg-error-100",
          warning: "!border-warning/30 !bg-warning-100",
          info: "!border-info/30 !bg-info-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
