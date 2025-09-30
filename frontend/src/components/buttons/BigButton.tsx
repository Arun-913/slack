import { ReactNode } from "react"

export const BigButton = ({ children, color, css, onClick }: {
    children: ReactNode,
    color: string, // magenta | white
    css?: string,
    onClick?: () => void
}) => {
    return (
        <button 
            className={`${color === 'magenta' ? 'border-x border-y border-[#4a154b] text-[#4a154b] hover:border-2 hover:transition-all hover:ease-in-out' : 'text-white bg-[#611f69]'} px-10 py-4 text-md font-semibold cursor-pointer mx-4 rounded ${css}`}
            onClick={onClick}
            type="button"
        >
            {children}
        </button>
    )   
}