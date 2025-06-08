import { useCommand } from "./hooks/useCommand"
import { CommandForm } from "./views/command/from"

export default function CreateAiCommand() {
  const commands = useCommand()

  return <CommandForm use={{ commands }} />
}
