import { useContext } from "react"
import { MessagingContext } from "../contexts/MessagingContext"

export function useMessaging() {
  const context = useContext(MessagingContext)

  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider")
  }

  return context
}