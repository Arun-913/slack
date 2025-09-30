import { useNavigate } from "react-router-dom"
import { HeaderButton } from "./buttons/Button"

export const Header = ({ signin = false }: {
    signin?: boolean
}) => {
    const navigate = useNavigate();
    return (
        <div className="flex justify-between items-center px-14 py-4">
            <div className="w-full">
                <img src="/images/logo.png" alt="" />
            </div>
            {!signin && (
                <div className="flex justify-end items-center w-full">
                    <h2 
                        className="font-semibold px-4 cursor-pointer"
                        onClick={() => navigate('/signin')}
                    >Sign in</h2>
                    <HeaderButton color="magenta">REQUEST A DEMO</HeaderButton>
                    <HeaderButton 
                        color="white"
                        onClick={() => navigate('/signin')}
                    >GET STARTED</HeaderButton>
                </div>

            )}

            {signin && (
                <div className="flex justify-end items-center w-full">
                    <HeaderButton color="magenta">TALK TO SALES</HeaderButton>
                    <HeaderButton color="white">CREATE A NEW WORKSPACE</HeaderButton>
                </div>
            )}
        </div>
    )
}