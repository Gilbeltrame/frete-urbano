import icon from "@/assets/ulog-icon.png"; // Let Vite handle hashing & correct dist path
import React from "react";

interface UlogIconProps {
	className?: string;
	size?: number;
}

export const UlogIcon: React.FC<UlogIconProps> = ({ className = "", size = 48 }) => {
	return <img src={icon} alt='ULog' width={size} height={size} className={className} style={{ objectFit: "contain" }} loading='lazy' />;
};

export default UlogIcon;
