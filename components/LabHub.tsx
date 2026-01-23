
import React, { useState, useEffect } from 'react';
import { PhysicsExperiment, User } from '../types';
import { dbService } from '../services/db';
import VirtualLab from './VirtualLab';
import VRLab from './VRLab';
import FutureLabs from './FutureLabs';
import { FlaskConical, Atom, RefreshCw } from 'lucide-react';
import WorkInteractive from './WorkInteractive';
import EnergyPendulum from './EnergyPendulum';

const LabHub: React.FC<{ user: User }> = ({ user }) => {
  const [experiments, setExperiments] = useState<PhysicsExperiment[]>([]);
  const [activeExperiment, setActiveExperiment] = useState<PhysicsExperiment | null>(null);
  const [activeVRLab, setActiveVRLab] = useState<PhysicsExperiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExps = async () => {
        setIsLoading(true);
        try {
            const data = await dbService.getExperiments();
            setExperiments(data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };
    fetchExps();
  }, []);

  if (activeExperiment) {
    return <VirtualLab experiment={activeExperiment} onBack={() => setActiveExperiment(null)} onSaveResult={(res) => console.log('Saved:', res)} />;
  }
  if (activeVRLab) {
    return <VRLab experiment={activeVRLab} onBack={() => setActiveVRLab(null)} />;
  }
  
  const basicExperiments = experiments.filter(e => !e.isFutureLab);
  const futureExps = experiments.filter(e => e.isFutureLab);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white text-right" dir="rtl">
      <header className="mb-16 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter italic">المختبر <span className="text-[#00d2ff] text-glow">التفاعلي</span></h2>
        <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
          جرّب القوانين الفيزيائية بنفسك. تحكم في المتغيرات وشاهد النتائج في بيئة آمنة ومتطورة.
        </p>
      </header>
      
      {isLoading ? (
          <div className="py-40 text-center animate-pulse"><RefreshCw className="w-12 h-12 text-[#00d2ff] animate-spin mx-auto" /></div>
      ) : (
          <>
            {/* Basic Interactive Labs */}
            <div className="mb-20">
                <h3 className="text-2xl font-black mb-8 border-r-4 border-[#00d2ff] pr-4 flex items-center gap-3"><FlaskConical/> مختبرات المنهج</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {basicExperiments.map(exp => (
                        <div key={exp.id} onClick={() => setActiveExperiment(exp)} className="glass-card p-8 rounded-[40px] cursor-pointer group flex items-start gap-6 bg-black/20 hover:border-[#00d2ff]/30 transition-all">
                        <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center text-3xl group-hover:bg-[#00d2ff]/10 group-hover:text-[#00d2ff] transition-all"><Atom /></div>
                        <div>
                            <h4 className="text-xl font-black text-white group-hover:text-[#00d2ff] transition-colors mb-2">{exp.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2">{exp.description}</p>
                        </div>
                        </div>
                    ))}
                    
                    {/* Hardcoded interactive features stay as they are functionally driven components */}
                    <WorkInteractive />
                    <EnergyPendulum />
                </div>
                {basicExperiments.length === 0 && (
                    <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[50px] opacity-30 italic">لا توجد تجارب إضافية مسجلة في المنهج حالياً.</div>
                )}
            </div>
            
            {/* Advanced Future Labs */}
            {futureExps.length > 0 ? (
                <FutureLabs onSelect={(exp) => setActiveVRLab(exp)} experiments={futureExps} />
            ) : (
                <div className="text-center py-20 opacity-20 border-t border-white/5">
                    <p className="text-xs uppercase tracking-[0.5em] font-black">مختبرات الأبحاث المتقدمة قيد التطوير</p>
                </div>
            )}
          </>
      )}
    </div>
  );
};

export default LabHub;
