import { MoreIcon } from "../../HeroIcons/MoreIcon"

export const More = ({ color }: {
    color: string
}) => {
    return (
        <div className="my-2 cursor-pointer hover:scale-110 transition-transform duration-200">
            <div className="w-10 bg-[#611f69] p-2 rounded-lg">
                <MoreIcon color={color} />
            </div>
            <div className="text-[#9d9b9f] text-sm font-medium">More</div>
        </div>
    )
}