import { ReactNode } from "react"

export const HeaderButton = ({ children, color, onClick }: {
    children: ReactNode,
    color: string, // magenta | white
    onClick?: () => void
}) => {
    // #4a154b - dark
    // #611f69 - light
    return (
        <button 
            className={`${color === 'magenta' ? 'border-x border-y border-[#4a154b] text-[#4a154b] hover:border-2 hover:transition-all hover:ease-in-out' : 'text-white bg-[#611f69]'} px-4 py-2 text-md font-semibold cursor-pointer mx-4 rounded`}
            onClick={onClick}
            type="button"
        >
            {children}
        </button>
    )   
}