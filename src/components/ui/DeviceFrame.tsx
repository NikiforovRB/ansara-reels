"use client";

import type { Device } from "./DeviceSwitcher";

export function DeviceFrame({
  device,
  children,
}: {
  device: Device;
  children: React.ReactNode;
}) {
  if (device === "mobile") {
    return (
      <div
        className="mx-auto"
        style={{ width: 380, maxWidth: "100%", boxShadow: "0 0 0 1px #eceef2" }}
      >
        {children}
      </div>
    );
  }
  return <>{children}</>;
}
