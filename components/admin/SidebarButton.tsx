import React from "react";
import Link from "next/link";

const SidebarButton: React.FC<{
  small?: string;
  text: string;
  onClick?: () => void;
  selected: boolean;
  link?: string;
}> = ({ small, text, onClick, selected, link }) => {
  const classes = `flex flex-col py-1 px-3 hover:bg-chickpea !no-underline justify-center rounded-md ${
    selected ? "bg-chickpea" : ""
  }`;
  if (link) {
    return (
      <Link href={link} className={classes}>
        {!!small && <small className="text-xs pt-1">{small}</small>}
        <span>{text}</span>
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={classes}>
      {!!small && <small className="text-xs pt-1">{small}</small>}
      <span>{text}</span>
    </button>
  );
};

export default SidebarButton;
