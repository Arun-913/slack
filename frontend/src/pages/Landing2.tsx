import { useEffect } from "react";
import { BigButton } from "../components/buttons/BigButton";
import { LeftArrow } from "../HeroIcons/LeftArrow";
import { useNavigate } from "react-router-dom";

export const Landing2 = () => {
    const navigate = useNavigate();
    useEffect(() => {
        const targets = document.querySelectorAll(".counter");

        const options = {
            root: null,
            rootMargin: "0px",
            threshold: 0.5,
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLElement;

                    const endValue = parseInt(target.dataset.value || "0", 10);
                    let startValue = 0;
                    const duration = 2000;

                    const stepTime = Math.abs(Math.floor(duration / endValue));
                    const interval = setInterval(() => {
                        startValue += 1;
                        target.textContent = `${startValue}%`;
                        if (startValue === endValue) clearInterval(interval);
                    }, stepTime);

                    observer.unobserve(target);
                }
            });
        }, options);

        targets.forEach((target) => {
            observer.observe(target);
        });

        return () => observer.disconnect();
    }, []);

  return (
    <div className="w-full flex flex-col justify-center items-center overflow-x-hidden">
        <div className="w-2/3 mt-10 z-20">
            <div>
                <div className="flex justify-center items-center">
                    <video
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-auto block m-0 p-0 border-none"
                    >
                    <source
                        src="https://a.slack-edge.com/1023c55/marketing/img/homepage/revamped-24/headline/hp-headline.en-GB@2x.mp4"
                        type="video/mp4"
                    />
                    </video>
                </div>

                <div className="flex justify-center items-center mt-4">
                    <BigButton 
                        color="white"
                        onClick={() => navigate('/signin')}
                    >
                        GET STARTED
                    </BigButton>
                    <BigButton 
                        color="magenta" 
                        css="flex items-center"
                        onClick={() => window.location.href = `https://slack.com/pricing`}
                    >
                        <div>FIND YOUR SUBSCRIPTION</div>
                        <LeftArrow className="text-[#611f69] ml-2" />
                    </BigButton>
                </div>

                <div className="text-center text-lg mt-4"><b>Slack is free to try</b> for as long as you like</div>

                <div>
                    <ul className="flex justify-around items-center my-10">
                    <li><img src="/images/airbnb.png" alt="" /></li>
                    <li><img src="/images/nasa.png" alt="" /></li>
                    <li><img src="/images/uber.png" alt="" /></li>
                    <li><img src="/images/target.png" alt="" /></li>
                    <li><img src="/images/tny.png" alt="" /></li>
                    <li><img src="/images/etsy.png" alt="" /></li>
                    </ul>
                </div>

                <video src="https://a.slack-edge.com/0cedc3b/marketing/img/homepage/true-prospects/hero-revamp/animation/hero@2x.IN.webm" className="rounded-lg" autoPlay loop muted></video>
            </div>
        </div>

        <div className="min-w-[157%] bg-[#f9f0ff] relative top-[-125px] rounded-[103%] overflow-hidden flex flex-col items-center justify-center z-10">
            <div className="text-5xl font-bold w-2/3 text-center mt-36">
                <div>Your people, projects, apps and AI, all on the </div>
                <div>world’s most beloved work operating system.</div>
            </div>

            <div className="mt-10  w-full max-w-[58%]">
                <div className="flex justify-between items-center">
                    <div className="w-1/2 right-[57%] mr-20 my-10">
                    <h3 className="text-sm font-semibold my-4">COLLABORATION</h3>
                    <h1 className="text-3xl font-bold mb-6">Communication in countless ways from one place</h1>
                    <div className="font-semibold text-lg mb-10 text-slate-900">
                        Slack is built for bringing people and information together. Type things out. Talk things through. Invite external organisations into the conversation.
                    </div>

                    <div className="flex justify-center items-center">
                        <div className="text-6xl font-bold text-blue-700 ml-4">80%</div>
                        <div className="ml-4 text-lg font-semibold text-gray-950">of the Fortune 100 use Slack Connect to work with partners and customers</div>
                    </div>
                </div>
                <div className="w-1/2 mr-10">
                    <video src="https://a.slack-edge.com/bb974f1/marketing/img/features/hero/refresh/01-channels.IN@2x.webm" autoPlay loop muted className="rounded-lg"></video>
                </div>
            </div>

            <div className="flex justify-between items-center my-10">
                <div className="w-1/2 right-[57%] mr-20">
                <h3 className="text-sm font-semibold my-4">PROJECT MANAGEMENT</h3>
                <h1 className="text-3xl font-bold mb-6">Manage projects and move work forwards faster.</h1>
                <div className="font-semibold text-lg mb-10 text-slate-900">
                    Prioritise tasks, share ideas and stay aligned. Slack brings every piece of your project together from start to finish.
                </div>

                <div className="flex justify-center items-center">
                    <div className="text-6xl font-bold text-blue-700 ml-4">47%</div>
                    <div className="ml-4 text-lg font-semibold text-gray-950">increase in productivity for teams using Slack</div>
                </div>
                </div>
                <div className="w-1/2 mr-10">
                <video src="https://a.slack-edge.com/3f3ec26/marketing/img/solutions/home/hero/02-lists.IN@2x.webm" autoPlay loop muted className="rounded-lg"></video>
                </div>
            </div>

            <div className="flex justify-between items-center my-10">
                <div className="w-1/2 right-[57%] mr-20">
                <h3 className="text-sm font-semibold my-4">INTEGRATIONS</h3>
                <h1 className="text-3xl font-bold mb-6">Tap into the tools that you already use.</h1>
                <div className="font-semibold text-lg mb-10 text-slate-900">
                    Over 2,600 apps are ready to connect in Slack, so you can automate everyday tasks in the flow of work and save your team precious time.
                </div>

                <div className="flex justify-center items-center">
                    <div className="text-6xl font-bold text-blue-700 ml-4">35%</div>
                    <div className="ml-4 text-lg font-semibold text-gray-950">increase in time saved due to automation for Slack users</div>
                </div>
                </div>
                <div className="w-1/2 mr-10">
                <video src="https://a.slack-edge.com/b26eef6/marketing/img/lp/work-os/ui/video-integrations-ui-02.IN.mp4" autoPlay loop muted className="rounded-lg"></video>
                </div>
            </div>
            </div>

            <div className="flex justify-center items-center mt-8 pb-24">
            {/* <BigButton color="white">GET STARTED</BigButton>
            <BigButton color="magenta" css="flex items-center">
                <div>FIND YOUR SUBSCRIPTION</div>
            </BigButton> */}
            <BigButton 
                color="white"
                onClick={() => navigate('/signin')}
            >
                GET STARTED
            </BigButton>
            <BigButton 
                color="magenta" 
                css="flex items-center"
                onClick={() => window.location.href = `https://slack.com/pricing`}
            >
                <div>FIND YOUR SUBSCRIPTION</div>
            </BigButton>
            </div>
        </div>

        <div className="bg-[#4a154b] overflow-hidden w-full relative mt-[-350px] py-20">
            <div className="w-full text-center text-5xl font-bold text-white mt-52 mb-24">We're in the business of growing businesses.</div>
            <div className="flex justify-between items-center mx-10 h-auto">
                <div className="pr-20">
                    <div className="text-8xl font-bold text-blue-400 counter" data-value="90">0%</div>
                    <div className="text-2xl font-bold text-white">of users say that Slack helps them to stay more connected</div>
                </div>
                <div className="px-20">
                    <div className="text-8xl font-bold text-blue-400 counter" data-value="43">0</div>
                    <div className="text-2xl font-bold text-white">The average number of apps used by teams in Slack</div>
                </div>
                <div className="pl-20">
                    <div className="text-8xl font-bold text-blue-400 counter" data-value="87">0%</div>
                    <div className="text-2xl font-bold text-white">of users say that Slack helps them to collaborate more efficiently</div>
                </div>
            </div>
        </div>
    </div>
  );
};
