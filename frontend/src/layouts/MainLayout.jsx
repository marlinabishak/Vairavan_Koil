import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen md:min-h-0 md:h-screen md:max-h-screen md:overflow-hidden bg-fig-bg relative overflow-x-hidden font-barlow w-full max-w-full">
      {/* Background image: bottom on mobile, top:170px to bottom on desktop */}
      <div
        className="absolute left-0 w-full pointer-events-none bottom-0 md:top-[170px] md:bottom-0 overflow-hidden"
      >
        <img src="/background.png" alt="" className="w-full h-full object-cover opacity-80" />
      </div>
      
      {/* Page Content */}
      <div className="relative z-10 w-full h-full overflow-x-hidden md:overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
