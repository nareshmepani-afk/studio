'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Your client-side config
import { resetPassword as resetPasswordAction } from '@/actions/resetPasswordAction';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid'>('verifying');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code || !auth) {
      setStatus('invalid');
      return;
    }

    // Verify the code with Firebase Client SDK
    verifyPasswordResetCode(auth, code)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setOobCode(code);
        setStatus('valid');
      })
      .catch(() => setStatus('invalid'));
  }, [searchParams]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const password = formData.get('password') as string;

    if (email) {
      const result = await resetPasswordAction(email, password);
      if (result.success) {
        router.push('/auth/login?msg=password-updated');
      } else {
        alert("Failed to update password.");
      }
    }
    setLoading(false);
  }

  if (status === 'verifying') return <p>Verifying link...</p>;
  if (status === 'invalid') return <p>This link is invalid or expired.</p>;

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1>Reset Password for {email}</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)); }} className="flex flex-col gap-4">
        <input 
          name="password" 
          type="password" 
          placeholder="New Password" 
          required 
          className="border p-2"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p>Verifying link...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}