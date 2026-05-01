export type Uuid = string

export interface CompanyDto { id: Uuid; name: string }
export interface EmployeeDto { id: Uuid; name: string; email: string }
export interface ProjectDto { id: Uuid; company_id: Uuid; name: string }
export interface TaskDto { id: Uuid; company_id: Uuid; name: string }

export interface TimeEntryDto {
  id: Uuid
  company_id: Uuid
  employee_id: Uuid
  project_id: Uuid
  task_id: Uuid
  date: string
  hours: number
  notes: string | null
  company?: CompanyDto
  employee?: EmployeeDto
  project?: ProjectDto
  task?: TaskDto
  created_at?: string
  updated_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}
