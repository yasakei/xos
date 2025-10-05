// packages/frontend/src/components/taskbar/SystemTray.tsx
import { useBattery, useNetworkState } from "react-use";
import {
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
} from "lucide-react";
import type { TaskbarSize } from "../../core/theme-engine/themeStore";

interface SystemTrayProps {
  size?: TaskbarSize;
}

export const SystemTray = ({ size = "medium" }: SystemTrayProps) => {
  const network = useNetworkState();
  const battery = useBattery();

  const sizeConfig = {
    small: { iconSize: 18, fontSize: "text-xs", spacing: "space-x-2" },
    medium: { iconSize: 22, fontSize: "text-sm", spacing: "space-x-4" },
    large: { iconSize:26, fontSize: "text-base", spacing: "space-x-6" },
  };

  const config = sizeConfig[size];

  const getBatteryIcon = () => {
    // Icons use the primary theme color for a consistent look
    if (!battery.isSupported || !battery.fetched) {
      return <BatteryFull size={config.iconSize} className="text-[color:var(--primary)] drop-shadow-sm" />;
    }
    if (battery.charging) {
      return <BatteryCharging size={config.iconSize} className="text-green-400 drop-shadow-sm" />;
    }
    if (battery.level > 0.7) {
      return <BatteryFull size={config.iconSize} className="text-[color:var(--primary)] drop-shadow-sm" />;
    }
    if (battery.level > 0.3) {
      return (
        <BatteryMedium size={config.iconSize} className="text-[color:var(--primary)] drop-shadow-sm" />
      );
    }
    if (battery.level > 0.1) {
      return <BatteryLow size={config.iconSize} className="text-orange-400 drop-shadow-sm" />;
    }
    return <Battery size={config.iconSize} className="text-red-500 drop-shadow-sm" />;
  };

  return (
    <div className={`flex items-center ${config.spacing} text-[color:var(--text-primary)]`}>
      {/* Wi-Fi Indicator - also uses primary color now */}
      <div className="flex items-center justify-center">
        {network.online ? (
          <Wifi size={config.iconSize} className="text-[color:var(--primary)] drop-shadow-sm" />
        ) : (
          <WifiOff size={config.iconSize} className="text-red-500 drop-shadow-sm" />
        )}
      </div>

      {/* Battery Indicator */}
      <div className="flex items-center space-x-2">
        {getBatteryIcon()}
        {battery.isSupported && battery.fetched && (
          <span className={`${config.fontSize} font-semibold tabular-nums`}>
            {Math.round(battery.level * 100)}%
          </span>
        )}
      </div>
    </div>
  );
};
