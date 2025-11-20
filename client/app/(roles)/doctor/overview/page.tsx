"use client"

import { useState, useEffect } from "react"
import { 
  Bell, 
  Search, 
  Settings, 
  Users, 
  AlertTriangle, 
  Calendar,
  Brain,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Stethoscope,
  Pill,
  FileText
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar } from "recharts"

// Mock data for the dashboard
const migraineTrendData = [
  { month: 'Jan', episodes: 12, severe: 3 },
  { month: 'Feb', episodes: 8, severe: 1 },
  { month: 'Mar', episodes: 15, severe: 4 },
  { month: 'Apr', episodes: 10, severe: 2 },
  { month: 'May', episodes: 6, severe: 1 },
  { month: 'Jun', episodes: 9, severe: 2 },
]

const triggerData = [
  { trigger: 'Stress', count: 45, color: '#ef4444' },
  { trigger: 'Sleep Deprivation', count: 32, color: '#f97316' },
  { trigger: 'Dehydration', count: 28, color: '#eab308' },
  { trigger: 'Hormonal Changes', count: 25, color: '#22c55e' },
  { trigger: 'Weather Changes', count: 18, color: '#3b82f6' },
  { trigger: 'Bright Lights', count: 15, color: '#8b5cf6' },
]

const recentActivities = [
  {
    id: 1,
    type: 'report',
    message: 'Sarah Chen submitted new migraine report',
    time: '10 minutes ago',
    severity: 'moderate'
  },
  {
    id: 2,
    type: 'medication',
    message: 'Updated prescription for John Doe',
    time: '25 minutes ago',
    severity: 'low'
  },
  {
    id: 3,
    type: 'alert',
    message: 'Unusual symptom pattern flagged for Emily Smith',
    time: '1 hour ago',
    severity: 'high'
  },
  {
    id: 4,
    type: 'appointment',
    message: 'Appointment confirmed with Michael Johnson',
    time: '2 hours ago',
    severity: 'low'
  }
]

const todayTasks = [
  { id: 1, task: 'Review severe patients (3 pending)', priority: 'high', completed: false },
  { id: 2, task: 'Approve medication changes', priority: 'medium', completed: false },
  { id: 3, task: 'Follow-up reminders (5 patients)', priority: 'medium', completed: true },
  { id: 4, task: 'Check new symptom reports', priority: 'low', completed: false },
]

const upcomingPatients = [
  {
    id: 1,
    name: 'Sarah Chen',
    time: '10:00 AM',
    severity: 'severe',
    avatar: '/avatars/sarah.jpg'
  },
  {
    id: 2,
    name: 'John Doe',
    time: '11:30 AM',
    severity: 'moderate',
    avatar: '/avatars/john.jpg'
  },
  {
    id: 3,
    name: 'Emily Smith',
    time: '2:00 PM',
    severity: 'mild',
    avatar: '/avatars/emily.jpg'
  },
  {
    id: 4,
    name: 'Michael Johnson',
    time: '3:30 PM',
    severity: 'moderate',
    avatar: '/avatars/michael.jpg'
  }
]

export default function DoctorDashboard() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-32 bg-white/70 rounded-lg border animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="h-96 bg-white/70 rounded-lg border animate-pulse"></div>
              ))}
            </div>
            <div className="space-y-6">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-64 bg-white/70 rounded-lg border animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">Good Morning, Doctor!</h1>
            <p className="text-gray-600">Here's what's happening with your patients today</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" className="relative">
              <Search className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                3
              </Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Notification Preferences</DropdownMenuItem>
                <DropdownMenuItem>Dashboard Settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar className="h-10 w-10 border-2 border-blue-200">
              <AvatarImage src="/avatars/doctor.jpg" alt="Dr. Johnson" />
              <AvatarFallback className="bg-blue-100 text-blue-700">DJ</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Patients</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">248</div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Severe Cases</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">8</div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                -3 from yesterday
              </p>
              <Badge variant="destructive" className="mt-2 text-xs">Requires Attention</Badge>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <Clock className="h-3 w-3 mr-1 text-blue-500" />
                Next: 10:00 AM
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Episode Reports</CardTitle>
              <Brain className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">36</div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <Activity className="h-3 w-3 mr-1 text-green-500" />
                This week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Migraine Episode Insights */}
            <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900">Migraine Episode Insights</CardTitle>
                    <CardDescription>Patient episode frequency over time</CardDescription>
                  </div>
                  <Tabs defaultValue="monthly" className="w-fit">
                    <TabsList className="bg-blue-50">
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    episodes: {
                      label: "Total Episodes",
                      color: "hsl(var(--chart-1))",
                    },
                    severe: {
                      label: "Severe Episodes", 
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-80 w-full"
                >
                  <AreaChart data={migraineTrendData}>
                    <defs>
                      <linearGradient id="episodeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="severeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" className="text-sm" />
                    <YAxis className="text-sm" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="episodes"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#episodeGradient)"
                      name="Total Episodes"
                    />
                    <Area
                      type="monotone"
                      dataKey="severe"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fill="url(#severeGradient)"
                      name="Severe Episodes"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Trigger Analytics */}
            <Card className="bg-white/70 backdrop-blur-sm border-purple-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Common Migraine Triggers</CardTitle>
                <CardDescription>Most reported triggers this month</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: {
                      label: "Count",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-64 w-full"
                >
                  <BarChart data={triggerData} layout="horizontal">
                    <XAxis type="number" className="text-sm" />
                    <YAxis type="category" dataKey="trigger" className="text-sm" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="bg-white/70 backdrop-blur-sm border-green-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Recent Activities</CardTitle>
                <CardDescription>Latest updates and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'report' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'medication' ? 'bg-green-100 text-green-600' :
                        activity.type === 'alert' ? 'bg-red-100 text-red-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'report' && <FileText className="h-4 w-4" />}
                        {activity.type === 'medication' && <Pill className="h-4 w-4" />}
                        {activity.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                        {activity.type === 'appointment' && <Calendar className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      <Badge 
                        variant={activity.severity === 'high' ? 'destructive' : activity.severity === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {activity.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Today's Tasks */}
            <Card className="bg-white/70 backdrop-blur-sm border-orange-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Today's Tasks</CardTitle>
                <CardDescription>Your priorities for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div key={task.id} className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                      task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                      <input 
                        type="checkbox" 
                        checked={task.completed}
                        className="rounded text-blue-600"
                        readOnly
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.task}
                        </p>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                          className="mt-1 text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="bg-white/70 backdrop-blur-sm border-indigo-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Patient Calendar</CardTitle>
                <CardDescription>December 2024</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {/* Days of week */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <div key={day} className="relative p-2 text-center hover:bg-blue-50 rounded cursor-pointer">
                      <span className={`${day === 14 ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''}`}>
                        {day}
                      </span>
                      {[3, 7, 12, 18, 22, 28].includes(day) && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Patients */}
            <Card className="bg-white/70 backdrop-blur-sm border-pink-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Next Patients</CardTitle>
                <CardDescription>Upcoming consultations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingPatients.map((patient) => (
                    <div key={patient.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                      <Avatar className="h-10 w-10 border-2 border-white">
                        <AvatarImage src={patient.avatar} alt={patient.name} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {patient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                        <p className="text-xs text-gray-500">{patient.time}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        patient.severity === 'severe' ? 'bg-red-500' :
                        patient.severity === 'moderate' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} title={`${patient.severity} condition`}></div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full mt-4 border-dashed">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Full Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
