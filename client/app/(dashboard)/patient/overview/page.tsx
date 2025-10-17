"use client"
import React from 'react'
import { Calendar } from "@/components/ui/calendar"
import BarChart  from '@/components/barChart'


const page = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return (
    <div>
      <BarChart></BarChart>
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-lg border"
      />
  </div>
  )
}

export default page