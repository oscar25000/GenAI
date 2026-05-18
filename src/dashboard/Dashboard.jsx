import { useEffect, useMemo, useState } from 'react'
import { mockProject, computeTeamLoad } from '../data/mockProject.js'
import Sidebar from '../components/Sidebar.jsx'
import TopBar from '../components/TopBar.jsx'
import OverviewSection from '../components/OverviewSection.jsx'
import SummarySection from '../components/SummarySection.jsx'
import WarningsSection from '../components/WarningsSection.jsx'
import TasksSection from '../components/TasksSection.jsx'
import PlanningSection from '../components/PlanningSection.jsx'
import TeamSection from '../components/TeamSection.jsx'
import RisksSection from '../components/RisksSection.jsx'
import ChecklistSection from '../components/ChecklistSection.jsx'
import ExportSection from '../components/ExportSection.jsx'
import SettingsModal from '../components/SettingsModal.jsx'

function loadProject() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['epipilot_project'], (res) => {
        resolve(res?.epipilot_project || mockProject)
      })
    })
  }
  try {
    const raw = localStorage.getItem('epipilot_project')
    return Promise.resolve(raw ? JSON.parse(raw) : mockProject)
  } catch {
    return Promise.resolve(mockProject)
  }
}

export default function Dashboard() {
  const [project, setProject] = useState(mockProject)
  const [section, setSection] = useState('overview')
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    loadProject().then(setProject)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash === '#settings') {
      setSettingsOpen(true)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) return
    const handler = (msg) => {
      if (msg?.type === 'epipilot:done' && msg.project) {
        setProject(msg.project)
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  const teamWithLoad = useMemo(() => computeTeamLoad(project), [project])

  function updateTask(id, patch) {
    setProject((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }

  function toggleChecklist(id) {
    setProject((p) => ({
      ...p,
      checklist: p.checklist.map((c) =>
        c.id === id ? { ...c, done: !c.done } : c,
      ),
    }))
  }

  return (
    <div className="min-h-screen w-full app-bg text-violet-50 flex">
      <Sidebar current={section} onChange={setSection} project={project} />
      <main className="flex-1 min-w-0 flex flex-col">
        <TopBar
          project={project}
          section={section}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1400px] mx-auto px-8 py-8 animate-fade-in">
            {section === 'overview' && (
              <OverviewSection
                project={project}
                team={teamWithLoad}
                onJump={setSection}
              />
            )}
            {section === 'summary' && <SummarySection project={project} />}
            {section === 'warnings' && <WarningsSection project={project} />}
            {section === 'tasks' && (
              <TasksSection
                project={project}
                team={teamWithLoad}
                onUpdateTask={updateTask}
              />
            )}
            {section === 'planning' && <PlanningSection project={project} />}
            {section === 'team' && (
              <TeamSection project={project} team={teamWithLoad} />
            )}
            {section === 'risks' && <RisksSection project={project} />}
            {section === 'checklist' && (
              <ChecklistSection
                project={project}
                onToggle={toggleChecklist}
              />
            )}
            {section === 'export' && <ExportSection project={project} />}
          </div>
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
