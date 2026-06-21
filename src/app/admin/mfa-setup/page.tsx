import MfaEnrollment from '@/components/admin/MfaEnrollment';

export const metadata = {
  title: 'MFA Security Enrollment | Memory Weaver Admin',
};

export default function MfaSetupPage() {
  return (
    <div 
      className="flex flex-col min-h-screen justify-center items-center bg-slate-950 p-4 text-slate-100"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }}
    >
      <MfaEnrollment />
      <div className="text-[10px] font-mono text-slate-600 text-center mt-4 pb-4">BUILD_VER: 2026-06-20-REVISION-008</div>
    </div>
  );
}
