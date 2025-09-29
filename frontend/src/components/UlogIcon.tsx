import React from "react";

interface UlogIconProps {
	className?: string;
	size?: number;
}

export const UlogIcon: React.FC<UlogIconProps> = ({ className = "", size = 48 }) => {
	return <img src='/src/assets/ulog-icon.png' alt='ULog' width={size} height={size} className={className} style={{ objectFit: "contain" }} />;
};

export default UlogIcon;
