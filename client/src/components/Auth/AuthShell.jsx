import { Link } from "react-router-dom";
import Logo from "../../assets/Airbnb-Logo.wine.svg";
import authImage from "../../assets/auth-image.png";

export default function AuthShell({
  children,
  title,
  subtitle,
  eyebrow = "YOUR NEXT STAY STARTS HERE",
  maxWidth = "max-w-[490px]",
}) {
  return (
    <main className="min-h-screen bg-white p-3 sm:p-4 lg:grid lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:gap-8">
      <aside className="relative h-[32vh] min-h-64 overflow-hidden rounded-3xl lg:h-[calc(100vh-2rem)] lg:min-h-[640px] lg:rounded-[28px]">
        <img
          src={authImage}
          alt="Mediterranean seaside villa"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <Link
          to="/"
          className="absolute left-5 top-5 inline-flex items-center rounded-full bg-white/15 px-3 py-2 backdrop-blur-md transition hover:bg-white/25 lg:left-8 lg:top-7"
          aria-label="Go to Airbnb home"
        >
          <img src={Logo} alt="Airbnb" className="h-13 w-auto brightness-0 invert" />
        </Link>
        <p className="absolute right-6 top-7 hidden text-right text-sm font-medium text-white drop-shadow sm:block lg:right-8 lg:top-10">
          Find your place in the world.
        </p>
        <div className="absolute bottom-6 left-5 right-5 text-white drop-shadow-lg sm:bottom-8 sm:left-8 sm:right-8 lg:bottom-10 lg:left-12 lg:right-12">
          <h2 className="max-w-[760px] text-3xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl lg:text-6xl xl:text-7xl">
            Feel at home,
            <br />
            wherever you roam.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/90 sm:text-base">
            Thoughtful stays, unforgettable places, and room to be yourself.
          </p>
        </div>
      </aside>

      <section className="flex min-h-[calc(68vh-1rem)] items-center justify-center px-2 py-8 sm:px-8 lg:min-h-screen lg:px-10 lg:py-12">
        <div className={`w-full ${maxWidth}`}>
          <header className="mb-7">
            <p className="mb-3 text-xs font-bold tracking-[0.12em] text-[#ff385c]">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#222] sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-sm leading-6 text-[#717171] sm:text-base">{subtitle}</p>
            )}
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
