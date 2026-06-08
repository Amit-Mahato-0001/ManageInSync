import authVideoOne from "@/shared/assets/AV-01.mp4"
import authVideoTwo from "@/shared/assets/AV-02.mp4"
import authVideoThree from "@/shared/assets/AV-03.mp4"
import authVideoFour from "@/shared/assets/AV-04.mp4"
import authVideoFive from "@/shared/assets/AV-05.mp4"
import authVideoSix from "@/shared/assets/AV-06.mp4"
import authVideoSeven from "@/shared/assets/AV-07.mp4"
import authVideoEight from "@/shared/assets/AV-08.mp4"

const authVideos = [
  authVideoOne,
  authVideoTwo,
  authVideoThree,
  authVideoFour,
  authVideoFive,
  authVideoSix,
  authVideoSeven,
  authVideoEight,
]

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-shell flex min-h-screen overflow-hidden bg-black text-white">
      <main className="flex min-h-screen flex-1 items-center justify-center px-6 py-10 lg:pr-[34rem] xl:pr-[38rem]">
        <div className="w-full max-w-[300px]">{children}</div>
      </main>

      <aside className="fixed bottom-0 right-0 top-0 hidden w-[504px] overflow-y-auto bg-black lg:block">
        <div className="grid grid-cols-[repeat(2,243px)] auto-rows-[243px] gap-2 p-2">
          {authVideos.map((videoSrc, index) => (
            <div
              key={videoSrc}
              className="relative h-[243px] w-[243px] overflow-hidden rounded-[3px] bg-zinc-950"
            >
              <video
                className="h-full w-full object-cover"
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload={index < 2 ? "auto" : "metadata"}
                aria-label={`Auth showcase video ${index + 1}`}
              />
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

export default AuthLayout
