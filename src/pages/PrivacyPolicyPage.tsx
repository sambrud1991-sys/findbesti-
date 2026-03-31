import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-extrabold text-foreground">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-xs text-muted-foreground/60">Last updated: March 31, 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Information We Collect</h2>
          <p>We collect the following information when you use FindBesti:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Account Info:</strong> Phone number, display name, gender, profile photo, and bio.</li>
            <li><strong className="text-foreground">Usage Data:</strong> App interactions, call duration, messages sent, and gifts exchanged.</li>
            <li><strong className="text-foreground">Device Info:</strong> Device model, OS version, unique device identifiers, and IP address.</li>
            <li><strong className="text-foreground">Payment Info:</strong> Transaction details processed through Razorpay (we do not store card details).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To create and manage your account</li>
            <li>To enable video/audio calls and messaging</li>
            <li>To process coin purchases and withdrawals</li>
            <li>To match you with other users</li>
            <li>To send notifications and updates</li>
            <li>To detect fraud and ensure platform safety</li>
            <li>To improve our services and user experience</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Data Sharing</h2>
          <p>We do not sell your personal data. We may share limited information with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Service Providers:</strong> Payment processors, cloud hosting, and analytics tools.</li>
            <li><strong className="text-foreground">Other Users:</strong> Your public profile (name, photo, bio) is visible to other users.</li>
            <li><strong className="text-foreground">Legal Authorities:</strong> When required by law or to protect user safety.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Data Storage & Security</h2>
          <p>Your data is stored securely on encrypted cloud servers. We implement industry-standard security measures including encryption in transit (TLS) and at rest. However, no method of transmission over the internet is 100% secure.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground">Access:</strong> Request a copy of your personal data.</li>
            <li><strong className="text-foreground">Correction:</strong> Update or correct inaccurate information.</li>
            <li><strong className="text-foreground">Deletion:</strong> Request deletion of your account and associated data.</li>
            <li><strong className="text-foreground">Withdraw Consent:</strong> Opt out of optional data processing at any time.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Cookies & Tracking</h2>
          <p>We use local storage and cookies to maintain your session, remember preferences (like language and dark mode), and improve app performance. You can clear this data through your browser or device settings.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Children's Privacy</h2>
          <p>FindBesti is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we discover that a minor has created an account, we will delete it immediately.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes through the app. Continued use of FindBesti after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">9. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or your data, contact us at:</p>
          <p className="text-foreground font-medium">support@findbesti.com</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
