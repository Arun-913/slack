
export const MoreIcon = ({ color }: {
    color: string
}) =>{
    return (
        <svg 
            data-y0c="true" 
            data-qa="ellipsis-horizontal-filled" 
            aria-hidden="true" 
            viewBox="0 0 20 20" 
            style={{ fontSize: 'var(--s, 20px)' }}  // Use CSS variables correctly
        >
            <path 
                fill={color} 
                d="M14.5 10a1.75 1.75 0 1 1 3.5 0 1.75 1.75 0 0 1-3.5 0m-6.25 0a1.75 1.75 0 1 1 3.5 0 1.75 1.75 0 0 1-3.5 0M2 10a1.75 1.75 0 1 1 3.5 0A1.75 1.75 0 0 1 2 10" 
            />
        </svg>
    )
}