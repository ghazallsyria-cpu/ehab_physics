"use client";

import React, { useState, useEffect } from 'react';
import {
  Waypoints,
  BrainCircuit,
  BarChart3,
  Smartphone,
  Tablet,
  Monitor,
  Lock,
  Star,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { BrochureSettings } from '../types';
import { dbService } from '../services/db';

const IconMap: Record<string, React.FC<any>> = {
  Waypoints,
  BrainCircuit,
  BarChart3,
  Smartphone,
  Tablet,
  Monitor,
  Lock,
  Star,
  Sparkles
};

const DynamicIcon = ({ name, ...props }: { name: string }) => {
  const Icon = IconMap[name];
  return Icon ? <Icon {...props} /> : null;
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color?: "amber" | "cyan";
}

const COLOR_STYLES = {
  amber: {
    border: "border-amber-400/20 hover:border-amber-400/40",
    bg: "bg-amber-400/5",
    icon: "bg-amber-400/10 text-amber-400",
    glow: "shadow-[0_0_80px_rgba(251,191,36,0.15)]"
  },
  cyan: {
    border: "border-cyan-400/20 hover:border-cyan-400/40",
    bg: "bg-cyan-400/5",
    icon: "bg-cyan-400/10 text-cyan-400",
    glow: "shadow-[0_0_80px_rgba(34,211,238,0.15)]"
  }
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color = "amber"
}) => {
  const c = COLOR_STYLES[color];

  return (
    <div className={`glass-panel p-10 rounded-[50px] border ${c.border} ${c.bg} ${c.glow} backdrop-blur-2xl transition-all hover:-translate-y-2`}>
      <div className="flex items-start gap-6">
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${c.icon} border border-white/5`}>
          <DynamicIcon name={icon} size={32} />
        </div>
        <div>
          <h3 className="text-2xl font-black mb-2 text-white">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

const PageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ""
}) => (
  <div className={`w-full max-w-5xl mx-auto bg-[#050a10] border border-white/10 rounded-[60px] shadow-2xl p-12 md:p-20 relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light" />
    {children}
  </div>
);

const MarketingBrochure: React.FC = () => {
  const [settings, setSettings] = useState<BrochureSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setSettings(await dbService.getBrochureSettings());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A2540] flex items-center justify-center">
        <RefreshCw className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0A2540] flex items-center justify-center text-red-400">
        فشل تحميل المحتوى
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2540] to-[#010304] text-white p-6 md:p-12 font-['Tajawal']" dir="rtl">
      <div className="space-y-12">

        <PageContainer className="text-center">
          <h1
            className="text-5xl md:text-7xl font-black mb-6"
            dangerouslySetInnerHTML={{ __html: settings.heroTitle }}
          />
          <p className="text-gray-400 max-w-2xl mx-auto">
            {settings.heroSubtitle}
          </p>
        </PageContainer>

        {[settings.section1Features, settings.section2Features, settings.section3Features].map(
          (section, i) => (
            <PageContainer key={i}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {section.map(f => (
                  <FeatureCard
                    key={f.id}
                    icon={f.icon}
                    title={f.title}
                    description={f.description}
                    color={f.color}
                  />
                ))}
              </div>
            </PageContainer>
          )
        )}

        <PageContainer className="text-center">
          <h3 className="text-3xl font-black mb-4">{settings.ctaTitle}</h3>
          <p className="text-gray-400 mb-8">{settings.ctaSubtitle}</p>

          <div className="flex justify-center">
            <QRCode value="https://kuwait-physics.web.app/" size={128} />
          </div>
        </PageContainer>

      </div>
    </div>
  );
};

export default MarketingBrochure;