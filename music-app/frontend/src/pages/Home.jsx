import React from 'react';

const Home = () => {
  return (
    <>
      <style>{`
        .home-page-root {
          background-color: #080808;
          color: #fff;
          font-family: 'Space Grotesk', sans-serif;
          min-height: calc(100dvh - 54px);
          position: relative;
          overflow-x: hidden;
          z-index: 10;
        }
        .glass-nav {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(168, 85, 247, 0.5);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
        }
        .hero-glow {
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: 12px;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.15);
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 0, 255, 0.5);
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.2);
        }
      `}</style>

      <div className="home-page-root">
        <div className="fixed top-20 left-10 w-16 h-16 bg-white opacity-10 rounded-sm transform rotate-45 blur-sm pointer-events-none" />
        <div className="fixed top-40 right-20 w-12 h-12 bg-white opacity-20 rounded-full blur-md pointer-events-none" />
        <div className="fixed bottom-20 left-32 w-8 h-8 bg-white opacity-10 rounded-full blur-sm pointer-events-none" />

        <header className="w-full flex justify-center pt-8 z-50 relative">
          <nav className="px-12 py-3 flex space-x-12 justify-center items-center w-[60%] mx-auto bg-[#181818] rounded-[30px] border border-[rgba(168,85,247,0.6)] shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <a className="text-white font-medium hover:text-fuchsia-400 transition-colors" href="#">Home</a>
            <a className="text-gray-400 font-medium hover:text-fuchsia-400 transition-colors" href="#">Explore</a>
            <a className="text-gray-400 font-medium hover:text-fuchsia-400 transition-colors" href="#">Library</a>
          </nav>
        </header>

        <main className="max-w-[1200px] mx-auto w-full pt-16 pb-24 relative z-10">
          <section className="flex flex-col md:flex-row items-center justify-between mb-24 relative">
            <div className="w-full md:w-[30%] z-10">
              <h1 className="text-5xl font-semibold mb-4 text-white drop-shadow-lg">Hello, User</h1>
              <p className="text-gray-400 mb-8 max-w-sm text-sm">Ultra high definition weights,<br />Space Grotesk</p>
              <button className="px-6 py-2 rounded-full border border-fuchsia-500 text-white hover:bg-fuchsia-900/30 transition-all hero-glow">
                Start Listening
              </button>
            </div>

            <div className="w-full md:w-[70%] flex justify-center relative mt-12 md:mt-0 h-64 md:h-[500px]">
              <img
                alt="Crystal Pyramid"
                className="object-contain w-full h-full drop-shadow-[0_0_30px_rgba(255,0,255,0.3)]"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDvyNGgzOZPty9MqzBR1iuaqWRmcT6F5s3xq7BgSa_otVG8TQBEEnhwgR2pETQ5kDt1y_rimJLI6W8Sd1qB12tA-xGHcjl0RIPhywIDKS1lHhAoeGevyRVsi26NgMY1xl_q4z_68lw6kSRNffLMWbdzPqIETj4rE448jQTusDS5Dd6sT466FRntFe6OIOiE9ogLqa0kPY285xya1LcRzQQThP-2EuK6RmH34gnTYMMFK5XMavr5JCkGenf5oBpOClqALNhdcd3EzwJ"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-7xl mx-auto pl-12 pr-12 w-full">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-6 text-white">For You</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <AlbumCard
                  title="Daft Punk - Random"
                  subtitle="Access Memories"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuC5RE2GFyVCFFjuIGS8MI--DLbMe3xb6ulIdM69AD9dCJVXi55Da-R6KjBAxEqU8AXDCgBQPvqzAlHC8IpFDd4F2hvpPWlnBqffIEUADCPSoUJFJHCKa0Fp46dOBmL_SzwosllVmg7Qpj_4DM9zFJoo8LYTwOqWbMWRcSJWIlt6fil9DLCvlMY4CggdqmElyLo4lDO2d4fyTDdG1NMlYnaew7X6jLxR3KMa6EvXz-iSlWMmqHS6oFphfD0ROaiOCu5V4Tuoc962EIXZ"
                />
                <AlbumCard
                  title="The Weeknd -"
                  subtitle="After Hours"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuB92Pnz6p4vMzH_gJSjk058AlcQ4ivdnLqUESMqe8zuV2q6cPILysgxUHcVmUO_a4Y6cWIPscqWBZwph-0IPbCiBf3G6LYYL7v1Ev2Ajbb0P7IO5W1Z8YX_nPPFV-NbBYbFnn-CUev46EVNIp8Ay2W46p6VD7d9IpZOgOhL742cvOTKcGRi3XrsLl64vRlkQ34tWayucbBie-F4pWUOGk0Nz2Bt-4k_0OFv2NIia_kY87PJDptJ5kdcCTvEYcB4ctMuztk1lAwH3G-P"
                />
                <AlbumCard
                  title="The Weend -"
                  subtitle="Romantus"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuB3M82kvVL9I605vIdbasS72-K6jtON25CBKbm-ZcnIDzjI8VX9Q30MlwNLfH-M34_UKUSlLSY0JECaZZesQzffWrS9qQF3rfpdHHtsmPnX9fT0AacV7yYgmtZNzycKRuEg-8gk-z6rcDnyRs6hMj0QocXqkcuZkp1Lf4Alay3WSBx5yZG8HCO3Auaiby4Dp4icNjgD6qwhFjFBCBGS_L5KB--W-k60x8hxtSUBRRX0PMHgHSTJSYqwpg1c8Wva7W9d5fgD8jNHpVEk"
                />
                <AlbumCard
                  title="The Black - The Kien"
                  subtitle="Now"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuDJclhjoAoL_hCGg90BHJo_JuGFK8cPuccFeVpfsCWwOHHvuorYc0L8dZPIm4b2TPPqEVq30kdVyv68jnqHsK3DFNUAXEVOYqvcIs0gOTBiYg51EX2B-8RLyO1xOl31dTyTXtVlV0X05oBx3Nd3RMJ9SslhWbpLJ3eKtkf8asBjyWk6Ss_gt-iw1tQxUiKBYpplAgr3s07N1UfHaxYBPMA8Znx2ZKhAiMauTjqacZYMv4upfw743F282NpgVOrTQR0VdO4QA8XZTL8-"
                />
                <AlbumCard
                  title="Daft Punk - The"
                  subtitle="Thregs"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuBfBcetbQxL6h3Q-MB-RIldsMNTwGsNqFxPqlPuz5L7h3lCZMYph5zmQ0mPmpbIWqfd9YQyU8r1gqItZ69kAY8Dx4W6R_S_YCD_wHkZkWssa-gjvykoO5Zg8I8po2GTdv4vVxC_XwG1OnK9-Xy0pwGJQIreUJO7KM2LP92csbF-wD3vTr3QQYufhlXsOwVEIDsNfSMJ3O3U5G7bEKfiGiqR9JquaeOQZD_wr0BnOlyExbZ70FYO0dRHojYNqD3BO3S84ztk3d3xsBT5"
                />
                <AlbumCard
                  title="The Weeknd -"
                  subtitle="Women Cimmor"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuBIkhLdgu4FTrgDaJx98kfnI2hBkJYHFYZQ-wWzhC4-DhWgjMDPFX8VMuIvt_RQTDF9kUp-RHUlQPbqvi0eocdZ6v28jAKvCTzPkgb_SDjOaivT0LZidIej3A7lOlumUYqNPSriMWkgYgB-SMx2Cy_JXBxsK3YzTNKvn3HZtY5cWHpPNaoCe04phSb3jL1lnDIO76jWLtBumj9eAYOws8Zmy4ijHHf4CLZEESggc__B6dHDW-H6jhD10a7RLa9gLUZD7ndcmt58K2LO"
                  pinkBackdrop
                />
                <AlbumCard
                  title="The Rown - Mlek"
                  subtitle="Harkur"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuDNrNp7FiEiPJnrJLBsELL2hM-ULAHOiUVBjHWTkZjKwHk8TxnIxjHK_8hMpTGWfRa43b6kiz06v85CBBaUJk4LOZOpzhS_YEmuDLh7v0As_HAncTNQUCvHHCd1dinRiLG6mUgqvic_j0QtnWEOHK3WaCmYfdHFyrdiA4Z5q6O3iZh81kB5wODkAPl3AJNiULDE75c_mAxLnMnOjTbXzLqjAjnfeDgQawKsW3OEsx8tX8h2Pdc0cPDBeGy6MdDvDqNUYjLc8hTrMHON"
                />
                <AlbumCard
                  title="Steve Mega -"
                  subtitle="Aatreotore"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuD20SnpHn9LlyuLFMU6ocvLTEgIiajObverkxA_BcIo-CZ-0mIXMM85ZESemDenywk7OEAGu4tip1WPAiC1vbyoDfbEZ-0mFB5xvEY8sSTxFxP7roTuucn8m24fDnLB7_21yJvwTkvHdcFPLy1fdaona9Xk4ZzR7Y2_ksr1W89Orjao2OwzNGgXhjH2RVwIL5UXTpUwh5ZnKpNTLHjjL6IZK6-xaUXPjxZKvPbm7Pv3aLWOtJaS2L8sEV0CI3EmN74QOvd3mgSpNaXA"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-6 text-white">Recently Played</h2>
              <div className="flex flex-col space-y-4">
                <RecentRow
                  title="Billie Eilish - Happier Than Ever"
                  subtitle="Space Grotesk"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuBmtsxbhXXQ2EyoxpOqJOGsJ57NUy9KqzGcpezJXzefjyV3lZ-lLYAtLXNegwS8xKiAr60ae_uEEVr37VqChjuEwX6YHwKcW0eIxn8oEJ1jvCEG2dxHjNBQB043gnfkr7oPep0uelCXWWAHDZsV0Kdh3n9GstyOwWZ3J8LxtXcljINH2ajrNjUelLydauafnK1ANwn3PX34Mjq2MJplH337AYcnnunebC1agOk4QzuJOEMjqeN3sR6fhDMwsQEdP5Ffg-xFOSFOteQs"
                />
                <RecentRow
                  title="Frank Ocean - Blonde"
                  subtitle="Spack Ocean"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuBtBjxbrKpaBz8JpWe0vGLk90C1dK_DFE3jdY1SeyZ0yQkrSRtA3x17RiT4NI3YjMV7hGbw2tI-NC6y6rsZfhbm__HdC8aN5AdCDN1_We2pPbfTt9YPmxN6CsqPNsovh11-qyaHBhJQ_OB8P4t5ylwBYj99EfGvB9Ioav7KB_UwLp9bk3XPOeU1ZT2U5xWLXagr0yrTfISNXhmVXdGCB-j6rOhgmHNSAzOAHS6Qwc80G2XJnxWfnFyTzy2QDTJMlicF9QH1TsCJdkz6"
                  compact
                />
                <RecentRow
                  title="Handi Unsh - Heatiy Curation"
                  subtitle="Space Grotesk"
                  image="https://lh3.googleusercontent.com/aida-public/AB6AXuDkduWTJs1XQOBRENjEf6stSS8MDfVUfPWaGoRWZDjxs_vYnCgLA2FPXzKaO4_I0YhgXgN1er6R-2gG0Q68YhPr4ZYUX41Z4KiL_Z4jymluts8s3C_2ZLqOf-UGaP2X0DjL-rc-JXluLPc2VEmSW3FJzCaz2g0yutUY0F1yN8kgtVBsISC-mJxRGDh6lfuS0ptkyF3BKkD0cy44YdAK-Q48xTb9lf9QrkM64uJgEIUjjZmAhrGKdfJZ9Cn7Rdr99gGyU9MifMCicilE"
                  active
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

const AlbumCard = ({ title, subtitle, image, pinkBackdrop = false }) => (
  <div className="glass-card rounded-xl p-2 cursor-pointer flex flex-col group border border-purple-500/30">
    <div className={`aspect-square rounded-lg overflow-hidden mb-3 ${pinkBackdrop ? 'bg-rose-500/80 p-6 flex items-center justify-center' : 'bg-gray-800'}`}>
      <img alt={title} className={`object-cover ${pinkBackdrop ? 'w-16 h-16 shadow-lg' : 'w-full h-full'}`} src={image} />
    </div>
    <div className="px-1">
      <h3 className="text-xs font-medium text-white line-clamp-1">{title}</h3>
      <p className="text-[10px] text-gray-400 line-clamp-1">{subtitle}</p>
    </div>
  </div>
);

const RecentRow = ({ title, subtitle, image, compact = false, active = false }) => (
  <div className={`rounded-xl p-2 flex items-center group cursor-pointer bg-[#1a1a1a] rounded-[12px] ${active ? 'border border-fuchsia-500/50 shadow-[0_0_10px_rgba(255,0,255,0.2)]' : 'border border-gray-600'}`}>
    <div className={`w-14 h-14 overflow-hidden bg-gray-800 mr-4 flex-shrink-0 rounded-[4px] ${compact ? 'flex items-center justify-center' : ''}`}>
      <img alt={title} className={compact ? 'w-10 h-10 object-cover shadow-md' : 'w-full h-full object-cover'} src={image} />
    </div>
    <div className="flex-grow pr-4">
      <h3 className="text-xs font-medium text-white truncate">{title}</h3>
      <p className="text-[10px] text-gray-400 truncate mt-1">{subtitle}</p>
    </div>
    <button className="text-gray-400 hover:text-white px-2" type="button">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </button>
  </div>
);

export default Home;
