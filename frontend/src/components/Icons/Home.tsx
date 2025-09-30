import { HomeIcon } from "../../HeroIcons/HomeIcon"

export const Home = ({ color, bgColor }: {
    color: string,
    bgColor?: string
}) => {
    return (
        <div className="my-2 cursor-pointer hover:scale-110 transition-transform duration-200">
            <div className={`w-10 ${bgColor ? `bg-[${bgColor}]` : 'bg-[#611f69]'} p-2 rounded-lg`}>
                <HomeIcon color={color}/>
            </div>
            <div className="text-[#9d9b9f] text-sm font-medium">Home</div>
        </div>
    )
}