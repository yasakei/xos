// packages/frontend/src/apps/xshell/commands/builtin/neofetch.command.tsx
import React from 'react';
import type { XTA } from '../../xta.types';
import { useUiStore } from '../../../../core/theme-engine/themeStore';
import { useAuthStore } from '../../../../store/authStore';

const Neofetch: React.FC<{
  version: string;
  theme: string;
  buildDate: string;
  username: string;
}> = ({ version, theme, buildDate, username }) => {
  const asciiArt = `
    \`..‑/+oosssso+/‑.\`
  \`/oossooossssssssssooo+/\`
\`/sso:. \`‑+ssssssssss+‑\` .:oss/
+ss‑ \`+ssssssssssssssssss+\` ‑ss+
/ss‑ \`ssssssssssssssssssss\` ‑ss/
/ss‑ \`sssssssssoosssssssss\` ‑ss/
/ss‑ \`ssssssss/  /ssssssss\` ‑ss/
/ss‑ \`sssssso\`    \`ossssss\` ‑ss/
/ss‑ \`ssssss\`      \`ssssss\` ‑ss/
/ss‑ \`sssssso\`    \`ossssss\` ‑ss/
/ss‑ \`ssssssss/  /ssssssss\` ‑ss/
/ss‑ \`sssssssssoosssssssss\` ‑ss/
+ss‑ \`+ssssssssssssssssss+\` ‑ss+
\`/sso+:. \`‑+ssssssssss+‑\` .:oss/
  \`/oossooossssssssssooo+/\`
    \`..‑/+oosssso+/‑.\`
`;

  return (
    <div className="flex gap-4">
      <pre className="text-cyan-400 text-[0.5rem] leading-tight">{asciiArt}</pre>
      <div className="flex flex-col justify-center">
        <p className="text-cyan-400 font-bold">{username}@XOS</p>
        <p className="border-b border-gray-500 my-1"></p>
        <p><span className="text-cyan-400 font-bold">Version:</span> {version}</p>
        <p><span className="text-cyan-400 font-bold">Theme:</span> {theme}</p>
        <p><span className="text-cyan-400 font-bold">Build Date:</span> {buildDate}</p>
      </div>
    </div>
  );
};

const neofetchCommand: XTA = {
  name: 'neofetch',
  description: 'Displays system information.',
  run: async (args, api) => {
    const { themeId } = useUiStore.getState();
    const { userData } = useAuthStore.getState();
    
    // These values are dynamically replaced by the build script
    const version = '0.3.26 "Celebi"'; 
    const buildDate = 'August 29, 2025';

    api.print(
      <Neofetch
        version={version}
        theme={themeId}
        buildDate={buildDate}
        username={userData?.username || 'user'}
      />
    );
  },
};

export default neofetchCommand;