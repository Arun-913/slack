
function getShortName(name: string) {
    name = name.trim();
    if(name === '') return '';

    let shortName = "";
    if(name.split(" ").length > 1) {
        shortName = name.split(" ")[0][0] + name.split(" ")[1][0];
    }
    else if(name.split("-").length > 1) {
        shortName = name.split("-")[0][0] + name.split("-")[1][0];
    }
    else {
        shortName = name[0];
    }
    return shortName.toLocaleUpperCase();
}

export const WorkspaceNameIcon = ({ title }: {
    title: string
}) => {
    let shortName = getShortName(title);
    return (
        <div className='my-2'>
            <div className={`w-10 bg-[#611f69] p-2 rounded-lg text-white font-semibold text-xl text-center ${shortName === '' && 'h-10'}`}>
                {shortName}
            </div>
        </div>
    )
}