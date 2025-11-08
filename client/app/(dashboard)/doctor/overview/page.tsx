import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconAlertTriangle, IconTrendingUp, IconTrendingDown, IconUsers, IconBrain, IconPill } from "@tabler/icons-react"
import data from "../../data.json"

// Mock data for migraine management
const migrainePatientsData = [
  {
    month: "Jan",
    activePatients: 245,
    riskLevel: 35,
  },
  {
    month: "Feb", 
    activePatients: 267,
    riskLevel: 42,
  },
  {
    month: "Mar",
    activePatients: 289,
    riskLevel: 38,
  },
  {
    month: "Apr",
    activePatients: 301,
    riskLevel: 45,
  },
  {
    month: "May",
    activePatients: 324,
    riskLevel: 41,
  },
  {
    month: "Jun",
    activePatients: 342,
    riskLevel: 39,
  },
]

const highRiskPatients = [
  {
    id: 1,
    name: "Sarah Johnson",
    riskScore: 89,
    lastEpisode: "2 days ago",
    severity: "High",
    adherence: "65%"
  },
  {
    id: 2,
    name: "Michael Chen",
    riskScore: 84,
    lastEpisode: "5 days ago", 
    severity: "High",
    adherence: "72%"
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    riskScore: 78,
    lastEpisode: "1 day ago",
    severity: "Medium",
    adherence: "58%"
  },
  {
    id: 4,
    name: "David Thompson",
    riskScore: 76,
    lastEpisode: "3 days ago",
    severity: "High",
    adherence: "81%"
  },
  {
    id: 5,
    name: "Lisa Anderson",
    riskScore: 74,
    lastEpisode: "1 week ago",
    severity: "Medium", 
    adherence: "69%"
  }
]

export default function DoctorOverviewPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Migraine Management Overview</h1>
        <p className="text-muted-foreground">Monitor patient analytics and identify high-risk cases</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <IconUsers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +5.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Severity Score</CardTitle>
            <IconBrain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.8</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <IconTrendingDown className="mr-1 h-3 w-3 text-green-500" />
              -0.4 from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medication Adherence</CardTitle>
            <IconPill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">74%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +2.1% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Risk Patients</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">39</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <IconTrendingDown className="mr-1 h-3 w-3 text-green-500" />
              -3 from last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Risk Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Patient Population Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient Population Trends</CardTitle>
              <CardDescription>Active patients and risk levels over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartAreaInteractive />
            </CardContent>
          </Card>
        </div>

        {/* High-Risk Patient Alerts */}
        <div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconAlertTriangle className="h-5 w-5 text-red-500" />
                High-Risk Alerts
              </CardTitle>
              <CardDescription>Patients requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {highRiskPatients.map((patient) => (
                <div key={patient.id} className="flex items-start space-x-3 rounded-lg border p-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{patient.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge 
                        variant={patient.severity === "High" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        Risk: {patient.riskScore}
                      </Badge>
                      <span>•</span>
                      <span>{patient.lastEpisode}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Adherence: {patient.adherence}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <button className="w-full text-sm text-blue-600 hover:text-blue-800">
                  View all alerts →
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Patient Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Patient Activity</CardTitle>
          <CardDescription>Latest migraine episodes and treatment updates</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable data={data} />
        </CardContent>
      </Card>
    </div>
  )
}