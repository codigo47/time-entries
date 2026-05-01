import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { CompanyDto, EmployeeDto, ProjectDto, TaskDto } from '@shared/types'

export const useLookupsStore = defineStore('lookups', () => {
  const companies = ref<CompanyDto[]>([])
  const employeesByCompany = ref<Record<string, EmployeeDto[]>>({})
  const projectsByCompany = ref<Record<string, ProjectDto[]>>({})
  const tasksByCompany = ref<Record<string, TaskDto[]>>({})
  const allEmployees = ref<EmployeeDto[]>([])
  const allProjects = ref<ProjectDto[]>([])
  const employeesByProject = ref<Record<string, EmployeeDto[]>>({})
  let allEmployeesLoaded = false
  let allProjectsLoaded = false

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
  async function loadAllEmployees() {
    if (allEmployeesLoaded) return
    allEmployeesLoaded = true
    try {
      const { data } = await api.get('/employees')
      allEmployees.value = data.data
    } catch {
      allEmployeesLoaded = false
    }
  }
  async function loadAllProjects() {
    if (allProjectsLoaded) return
    allProjectsLoaded = true
    try {
      const { data } = await api.get('/projects')
      allProjects.value = data.data
    } catch {
      allProjectsLoaded = false
    }
  }

  async function loadEmployeesByProject(projectId: string) {
    if (employeesByProject.value[projectId]) return
    const { data } = await api.get(`/projects/${projectId}/employees`)
    employeesByProject.value = { ...employeesByProject.value, [projectId]: data.data }
  }

  function invalidateAll() {
    companies.value = []
    employeesByCompany.value = {}
    projectsByCompany.value = {}
    tasksByCompany.value = {}
    allEmployees.value = []
    allProjects.value = []
    employeesByProject.value = {}
    allEmployeesLoaded = false
    allProjectsLoaded = false
  }

  return {
    companies, employeesByCompany, projectsByCompany, tasksByCompany,
    allEmployees, allProjects, employeesByProject,
    loadCompanies, loadEmployees, loadProjects, loadTasks,
    loadAllEmployees, loadAllProjects, loadEmployeesByProject,
    invalidateAll,
  }
})
