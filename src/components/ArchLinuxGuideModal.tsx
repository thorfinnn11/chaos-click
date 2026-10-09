import React, { useState } from 'react';
import { Terminal, Copy, Check, Layers, Monitor, Play, Cpu, ShieldCheck } from 'lucide-react';

interface ArchLinuxGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchLinuxGuideModal: React.FC<ArchLinuxGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'step0' | 'arch_commands' | 'hackathon_pitch' | 'standalone'>('step0');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const archStep0Commands = `# 1. Update Arch Linux system packages
sudo pacman -Syu

# 2. Install Node.js (LTS), NPM, and Git (Arch official repos)
sudo pacman -S nodejs npm git base-devel

# Verify Node.js and NPM versions
node -v
npm -v

# (Optional) If you prefer fnm (Fast Node Manager) from AUR:
# yay -S fnm-bin
# fnm install --lts && fnm use --lts`;

  const archSetupCommands = `# 1. Create your hackathon project directory
mkdir -p ~/projects/chaos-click
cd ~/projects/chaos-click

# 2. Initialize Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# 3. Install required runtime & styling libraries
npm install lucide-react motion @tailwindcss/vite tailwindcss gsap lenis

# 4. Start the local development server (runs on port 3000)
npm run dev -- --port 3000 --host

# 5. Build for production distribution
npm run build

# 6. Test production bundle with preview
npm run preview`;

  const archStandaloneCommands = `# Standalone zero-dependency single-file version:
mkdir -p ~/chaos-standalone && cd ~/chaos-standalone

# Create index.html with the standalone bundle
cat << 'EOF' > index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CHAOS.exe // Single-File Graphite & Amber Build</title>
  <style>
    body { background: #121316; color: #f3f4f6; font-family: monospace; text-align: center; padding: 50px; }
    button { background: #ffb000; color: #000; border: none; padding: 18px 32px; font-weight: bold; cursor: pointer; border-radius: 4px; font-size: 18px; }
  </style>
</head>
<body>
  <h1>A PERFECTLY NORMAL WEBSITE</h1>
  <button id="btn" onclick="handleClick()">ACTIVATE EXPERIENCE</button>
  <p id="log">Reality: 100%</p>
  <script>
    let c = 0;
    function handleClick() {
      c += 25;
      document.body.style.transform = 'rotate(' + (c * 0.05) + 'deg)';
      document.getElementById('log').innerText = 'Entropy: ' + c + '%';
    }
  </script>
</body>
</html>
EOF

# Serve instantly using Python's built-in HTTP server on Arch Linux:
python -m http.server 8080`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md font-mono text-xs select-none">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#121316] border-2 border-[#ffb000] shadow-[8px_8px_0px_#422900] flex flex-col overflow-hidden text-amber-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#181920] border-b-2 border-[#ffb000]/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🐧</span>
            <div>
              <h2 className="text-sm font-black text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                ARCH LINUX TERMINAL BLUEPRINT // PROLE UNDERGROUND GUIDE
              </h2>
              <p className="text-[10px] text-amber-500/80">
                Step 0 terminal toolchain, Vite production setup & 90s Hackathon Pitch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#ffb000] hover:bg-amber-300 text-black font-black uppercase tracking-wider transition-colors text-xs"
          >
            DISMISS
          </button>
        </div>

        {/* Tab Navigation in Graphite & Amber */}
        <div className="flex border-b-2 border-[#ffb000]/40 bg-[#0e0f12] px-4 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('step0')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors flex items-center gap-1.5 uppercase ${
              activeTab === 'step0'
                ? 'border-[#ffb000] text-amber-400 bg-[#181920]'
                : 'border-transparent text-slate-400 hover:text-amber-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            1. Arch Packages (pacman)
          </button>
          <button
            onClick={() => setActiveTab('arch_commands')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors flex items-center gap-1.5 uppercase ${
              activeTab === 'arch_commands'
                ? 'border-[#ffb000] text-amber-400 bg-[#181920]'
                : 'border-transparent text-slate-400 hover:text-amber-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            2. Vite & React Workflow
          </button>
          <button
            onClick={() => setActiveTab('hackathon_pitch')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors flex items-center gap-1.5 uppercase ${
              activeTab === 'hackathon_pitch'
                ? 'border-[#ffb000] text-amber-400 bg-[#181920]'
                : 'border-transparent text-slate-400 hover:text-amber-300'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            3. Hackathon 90s Pitch
          </button>
          <button
            onClick={() => setActiveTab('standalone')}
            className={`py-2.5 px-3 border-b-2 font-bold transition-colors flex items-center gap-1.5 uppercase ${
              activeTab === 'standalone'
                ? 'border-[#ffb000] text-amber-400 bg-[#181920]'
                : 'border-transparent text-slate-400 hover:text-amber-300'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            4. Standalone File & Deploy
          </button>
        </div>

        {/* Modal Body in Graphite */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#121316]">
          {activeTab === 'step0' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#181920] border border-[#ffb000]/40 rounded text-amber-200 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-400 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Arch Linux Step 0: Installing the Base Toolchain
                </div>
                Arch uses <strong>pacman</strong>. You need Node.js, npm, git, and base-devel.
                Run the terminal commands below in your favorite terminal (Alacritty, Kitty, Konsole, or Foot).
              </div>

              <div className="relative rounded bg-[#0d0e11] border border-[#2b2e38] p-4 text-slate-300">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#20222a] text-slate-400">
                  <span>bash // Arch Linux Terminal</span>
                  <button
                    onClick={() => copyToClipboard(archStep0Commands, 'step0')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1c24] hover:bg-[#252833] text-amber-300 rounded transition-colors text-[11px] border border-[#353947]"
                  >
                    {copiedId === 'step0' ? <Check className="w-3 h-3 text-amber-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'step0' ? 'Copied!' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-relaxed text-amber-300">
                  {archStep0Commands}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'arch_commands' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#181920] border border-[#2b2e38] rounded text-slate-300 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-400 mb-1">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  Step 1 & 2: Initializing with Vite, GSAP & Lenis
                </div>
                This setup uses Vite, Tailwind CSS, GSAP for screen twitches, and Lenis for smooth momentum scrolling.
              </div>

              <div className="relative rounded bg-[#0d0e11] border border-[#2b2e38] p-4 text-slate-300">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#20222a] text-slate-400">
                  <span>bash // Project Scaffolding</span>
                  <button
                    onClick={() => copyToClipboard(archSetupCommands, 'arch_cmd')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1c24] hover:bg-[#252833] text-amber-300 rounded transition-colors text-[11px] border border-[#353947]"
                  >
                    {copiedId === 'arch_cmd' ? <Check className="w-3 h-3 text-amber-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'arch_cmd' ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-relaxed text-amber-300">
                  {archSetupCommands}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'hackathon_pitch' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#181920] border border-[#ffb000]/40 rounded text-amber-200 space-y-2">
                <h3 className="font-bold text-amber-400 text-sm">
                  Winning 90-Second Demo Script for Judges
                </h3>
                <p className="text-xs text-slate-300">
                  Judges see generic animations. Here is your formula showing intentional psychology and engineering:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-[#14151a] border border-[#2b2e38] rounded">
                  <strong className="text-amber-400 block mb-1">0:00 - 0:15 (The Hook)</strong>
                  <p className="text-slate-300 text-[11px]">
                    "Judges, it starts as a high-end graphite and amber digital product with butter-smooth Lenis scrolling. But every click destabilizes the reality."
                  </p>
                </div>
                <div className="p-3 bg-[#14151a] border border-[#2b2e38] rounded">
                  <strong className="text-amber-300 block mb-1">0:15 - 0:40 (Escalation & Audio)</strong>
                  <p className="text-slate-300 text-[11px]">
                    "Within 4 clicks, GSAP twitches the viewport, procedural Web Audio generates CRT noise, and the Big Brother Telescreen Eye starts tracking your mouse."
                  </p>
                </div>
                <div className="p-3 bg-[#14151a] border border-[#2b2e38] rounded">
                  <strong className="text-orange-400 block mb-1">0:40 - 1:10 (Memory & Modes)</strong>
                  <p className="text-slate-300 text-[11px]">
                    "Chaos has persistent memory: it tracks which elements you poke across reboots. Switch between Doublethink, Minitrue, and Memory Hole zero-G physics."
                  </p>
                </div>
                <div className="p-3 bg-[#14151a] border border-[#2b2e38] rounded">
                  <strong className="text-red-400 block mb-1">1:10 - 1:30 (The Room 101 Ending)</strong>
                  <p className="text-slate-300 text-[11px]">
                    "At Click 4 (100%), Room 101 locks the screen, shows a click interrogation heatmap, and the reset twist: 'Do it to Julia! Not me!'"
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'standalone' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#181920] border border-[#2b2e38] rounded text-slate-300">
                <strong>Zero-Dependency Arch Deployment:</strong> You can serve this app on Arch Linux using Python, Caddy (`sudo pacman -S caddy`), or push to GitHub Pages.
              </div>

              <div className="relative rounded bg-[#0d0e11] border border-[#2b2e38] p-4 text-slate-300">
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#20222a] text-slate-400">
                  <span>bash // Quick Standalone Server</span>
                  <button
                    onClick={() => copyToClipboard(archStandaloneCommands, 'standalone')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1a1c24] hover:bg-[#252833] text-amber-300 rounded transition-colors text-[11px] border border-[#353947]"
                  >
                    {copiedId === 'standalone' ? <Check className="w-3 h-3 text-amber-400" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'standalone' ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-relaxed text-amber-300">
                  {archStandaloneCommands}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0e0f12] border-t-2 border-[#ffb000]/40 flex justify-between items-center text-slate-400 text-[11px]">
          <span>Arch Linux Kernel: 6.x · Rolling Release · TTY Ready</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#ffb000] hover:bg-amber-300 text-black font-black uppercase rounded-none transition-colors"
          >
            RETURN TO TELESCREEN
          </button>
        </div>
      </div>
    </div>
  );
};
