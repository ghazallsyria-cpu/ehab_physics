
import React, { useState } from 'react';
import { PhysicsExperiment, User } from '../types';
import { INITIAL_EXPERIMENTS } from '../constants';
import VirtualLab from './VirtualLab';
import VRLab from './VRLab';
import FutureLabs from './FutureLabs';
import { FlaskConical, Atom } from 'lucide-react';
import WorkInteractive from './WorkInteractive';
import EnergyPendulum from './EnergyPendulum';

const LabHub: React.FC<{ user: User }> = ({ user }) => {
  const [activeExperiment, setActiveExperiment] = useState<PhysicsExperiment | null>(null);
  const [activeVRLab, setActiveVRLab] = useState<PhysicsExperiment | null>(null);

  if (activeExperiment) {
    return <VirtualLab experiment={activeExperiment} onBack={() => setActiveExperiment(null)} onSaveResult={(res) => console.log('Saved:', res)} />;
  }
  if (activeVRLab) {
    return <VRLab experiment={activeVRLab} onBack={() => setActiveVRLab(null)} />;
  }
  
  const basicExperiments = INITIAL_EXPERIMENTS.filter(e => !e.isFutureLab);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-fadeIn font-['Tajawal'] text-white">
      <header className="mb-16 text-center">
        <h2 className="text-5xl font-black mb-4 tracking-tighter">المختبر <span className="text-[#00d2ff]">الافتراضي</span></h2>
        <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed">
          تفاعل مع القوانين الفيزيائية مباشرة. غيّر المتغيرات، شاهد النتائج، وافهم "لماذا" وراء المعادلات.
        </p>
      </header>
      
      {/* Basic Interactive Labs */}
      <div className="mb-20">
        <h3 className="text-2xl font-black mb-8 border-r-4 border-[#00d2ff] pr-4 flex items-center gap-3"><FlaskConical/> المختبر الافتراضي</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {basicExperiments.map(exp => (
            <div key={exp.id} onClick={() => setActiveExperiment(exp)} className="glass-card p-8 rounded-[40px] cursor-pointer group flex items-start gap-6">
              <div className="w-16 h-16 rounded-3xl bg-black/20 border border-white/5 flex items-center justify-center text-3xl group-hover:bg-[#00d2ff]/10 group-hover:text-[#00d2ff] transition-all"><Atom /></div>
              <div>
                <h4 className="text-xl font-black text-white group-hover:text-[#00d2ff] transition-colors mb-2">{exp.title}</h4>
                <p className="text-sm text-gray-500">{exp.description}</p>
              </div>
            </div>
          ))}
          <WorkInteractive />
          <EnergyPendulum />
        </div>
      </div>
      
      {/* Advanced Future Labs */}
      <FutureLabs onSelect={(exp) => setActiveVRLab(exp)} />
    </div>
  );
};

export default LabHub;
