import fs from 'fs';
const text = fs.readFileSync('app/groups/page.tsx', 'utf8');
const lines = text.split('\n');
// find the index of the last '  return ('
let returnIndex = -1;
for(let i = 0; i < lines.length; i++) {
    if(lines[i].startsWith('  return (')) {
        returnIndex = i;
    }
}
if(returnIndex > -1) {
    const safeText = lines.slice(0, returnIndex).join('\n');
    const newUI = `  return (
    <AppLayout>
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)] -mx-6 -my-6">
        <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col p-4 overflow-y-auto">
          <div className="bg-slate-900 text-white rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold tracking-widest text-center mb-2">TEST<span className="text-slate-400 font-light">GROUP</span></h2>
            <div className="flex justify-center"><span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full">ACTIVE CLUSTER</span></div>
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800">Test Group</h3>
            <p className="text-sm text-slate-500 mb-2">👥 2 Members • Private</p>
            <p className="text-sm text-slate-600">A focused group for architectural history research and digital synthesis workflows.</p>
          </div>
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">ACTIVE CONTRIBUTORS</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=11" alt="User" /></div>
                  <div className="flex-1"><p className="text-sm font-medium text-slate-800">John Doe</p><p className="text-xs text-emerald-600">Lead Researcher</p></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <img className="w-8 h-8 rounded-full border-2 border-white" src="https://i.pravatar.cc/100?img=11" alt="User" />
                </div>
                <div><h3 className="text-slate-800 font-medium">Group Dialogue</h3></div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
             <div className="flex justify-center"><span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full font-medium uppercase">Today</span></div>
             <div className="flex gap-3 max-w-[80%]">
                <img className="w-8 h-8 rounded-full" src="https://i.pravatar.cc/100?img=11" alt="User" />
                <div>
                   <div className="bg-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-none text-sm">
                     Hey Sarah, I've just uploaded the latest manuscript for the architectural synthesis.
                   </div>
                   <p className="text-xs text-slate-400 mt-1 ml-1">John Doe • 10:42 AM</p>
                </div>
             </div>
          </div>
          <div className="p-4 bg-white border-t border-slate-100">
             <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl">
                <input type="text" placeholder="Synthesize a message..." className="flex-1 bg-transparent px-2 py-2 outline-none text-sm" />
                <button className="p-2 bg-slate-700 text-white rounded-xl hover:bg-slate-800">➤</button>
             </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
`;
    fs.writeFileSync('app/groups/page.tsx', safeText + '\n' + newUI);
    console.log("Success");
}
