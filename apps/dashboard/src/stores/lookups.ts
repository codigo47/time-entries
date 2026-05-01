import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { CompanyDto, EmployeeDto, ProjectDto, TaskDto } from '@shared/types'

export const useLookupsStore = defineStore('lookups', () => {
  const companies = ref<CompanyDto[]>([])
  const employeesByCompany = ref<Record<string, EmployeeDto[]>>({})
  const projectsByCompany = ref<Record<string, ProjectDto[]>>({})
  const tasksByCompany = ref<Record<string, TaskDto[]>>({})

  async function loadCompanies() {
    if (companies.value.length) return
    const { data } = await api.get('/companies')
    companies.value = data.data
  }
  async function loadEmployees(companyId: string) {
    if (employeesByCompany.value[companyId]) return
    const { data } = await api.get(`/companies/${companyId}/employees`)
    employeesByCompany.value = { ...employeesByCompany.value, [companyId]: data.data }
  }
  async function loadProjects(companyId: string) {
    if (projectsByCompany.value[companyId]) return
    const { data } = await api.get(`/companies/${companyId}/projects`)
    projectsByCompany.value = { ...projectsByCompany.value, [companyId]: data.data }
  }
  async function loadTasks(companyId: string) {
    if (tasksByCompany.value[companyId]) return
    const { data } = await api.get(`/companies/${companyId}/tasks`)
    tasksByCompany.value = { ...tasksByCompany.value, [companyId]: data.data }
  }

  function invalidateAll() {
    companies.value = []
    employeesByCompany.value = {}
    projectsByCompany.value = {}
    tasksByCompany.value = {}
  }

  return {
    companies, employeesByCompany, projectsByCompany, tasksByCompany,
    loadCompanies, loadEmployees, loadProjects, loadTasks, invalidateAll,
  }
})
