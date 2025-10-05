// packages/frontend/src/apps/xshell/commands/builtin/help.command.tsx
import React from 'react';
import type { XTA_Command } from '../../xta.types';

export const helpCommand: XTA_Command = {
  name: 'help',
  description: 'Displays a list of available commands.',
  usage: 'help',

  async run(args, api) {
    api.print('XOS Shell - Available Commands:\n');
    const commands = Array.from(api.getCommands().values());
    commands.sort((a, b) => a.name.localeCompare(b.name));

    const maxNameLength = Math.max(...commands.map(c => c.name.length));

    for (const cmd of commands) {
        const padding = ' '.repeat(maxNameLength - cmd.name.length + 4);
        api.print(<span><span className="text-blue-400">{cmd.name}</span>{padding}{cmd.description}</span>);
    }
  },
};
