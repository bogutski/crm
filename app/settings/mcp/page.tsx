import { MCPServerInfo } from './components/MCPServerInfo';

export default function MCPSettingsPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          MCP Сервер
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Подключите CRM к Claude Desktop, Cursor и другим MCP-совместимым клиентам
        </p>
      </div>
      <MCPServerInfo />
    </div>
  );
}
