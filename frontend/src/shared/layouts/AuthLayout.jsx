const AuthLayout = ({ children }) => {
  return (
    <div className="auth-shell flex min-h-screen text-2xl">
      <div className="relative hidden md:block md:w-1/2 overflow-hidden">
        <img src="a.jpeg" className="absolute inset-0 h-full w-full object-cover" />
        <div className="relative z-10 p-10">
          <img src="Union.png" className="h-12 w-auto" />
        </div>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center bg-[#09090B] px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

export default AuthLayout