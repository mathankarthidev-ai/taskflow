"use client";
import { useEffect, useState } from "react";
export function ThemeToggle(){const [dark,setDark]=useState(false);useEffect(()=>{setDark(localStorage.theme==="dark")},[]);function flip(){const next=!dark;setDark(next);localStorage.theme=next?"dark":"light";document.documentElement.classList.toggle("dark",next)}return <button className="icon-button" onClick={flip} aria-label="Toggle theme">{dark?"☀︎":"◐"}</button>}
