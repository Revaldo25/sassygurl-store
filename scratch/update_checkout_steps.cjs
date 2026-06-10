const fs = require('fs');
let content = fs.readFileSync('app/games/[slug]/CheckoutClient.tsx', 'utf8');

// 1. Add icons to lucide-react import
content = content.replace(/import \{([^}]+)\} from "lucide-react";/, 'import { $1, Gem, Package, Wallet, UserRound } from "lucide-react";');

// 2. Modify StepHeader component
const oldStepHeaderRegex = /const StepHeader = \(\{ num, title, done \}: \{ num: number; title: string; done\?: boolean \}\) => \([\s\S]*?<\/div>\s*<\/div>\s*\);/;

const newStepHeader = `const StepHeader = ({ num, title, icon: Icon, done }: { num: number; title: string; icon?: any; done?: boolean }) => (
    <div className="relative z-10 mb-6 flex items-start gap-4">
      <div 
        className="relative w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 shadow-inner"
        style={done 
          ? { backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", boxShadow: "0 0 20px rgba(16,185,129,0.1)" } 
          : { backgroundColor: \`\${accent}15\`, color: accent, border: \`1px solid \${accent}40\`, boxShadow: \`0 0 15px \${accent}20\` }
        }
      >
        {done ? <CheckCircle2 className="w-5 h-5" /> : (Icon ? <Icon className="w-5 h-5 drop-shadow-md" /> : <span className="font-black text-sm">{num}</span>)}
      </div>
      <div className="pt-1">
        <p className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-0.5">Step 0{num}</p>
        <h2 className="text-xl font-bold text-white tracking-tight leading-none">{title}</h2>
      </div>
    </div>
  );`;

content = content.replace(oldStepHeaderRegex, newStepHeader);

// 3. Update Step 2 call
content = content.replace(/<StepHeader num=\{2\} title="Pilih Item" done=\{!!selectedProduct\} \/>/g, '<StepHeader num={2} title="Pilih Item" icon={Package} done={!!selectedProduct} />');

// 4. Update Step 3 call
content = content.replace(/<StepHeader num=\{3\} title="Pembayaran" done=\{!!selectedPayment\} \/>/g, '<StepHeader num={3} title="Pembayaran" icon={Wallet} done={!!selectedPayment} />');

// 5. Update Step 4 call
content = content.replace(/<StepHeader num=\{4\} title="Informasi Kontak" \/>/g, '<StepHeader num={4} title="Informasi Kontak" icon={UserRound} />');

// 6. Update Product Card inside grid to include Gem icon
// Note: We'll use a regex to find the product name paragraph.
const oldProductCardRegex = /<p className=\{`text-xs md:text-sm font-semibold truncate w-full mb-1 \$\{active \? "text-white" : "text-white\/70 group-hover:text-white"\}`\}>\s*\{cleanName\}\s*<\/p>/;
const newProductCard = `<div className="flex items-center gap-2 mb-1.5 w-full">
                            <Gem className={\`w-4 h-4 shrink-0 \${active ? "opacity-100" : "opacity-40"}\`} style={active ? { color: accent } : {}} />
                            <p className={\`text-xs md:text-sm font-semibold truncate flex-1 \${active ? "text-white" : "text-white/70 group-hover:text-white"}\`}>
                              {cleanName}
                            </p>
                          </div>`;
content = content.replace(oldProductCardRegex, newProductCard);

fs.writeFileSync('app/games/[slug]/CheckoutClient.tsx', content);
console.log('Done replacing CheckoutClient icons and steps');
