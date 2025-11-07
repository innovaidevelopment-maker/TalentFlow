import type { User, Employee, Applicant, CriteriaTemplate, EvaluationResult, LevelThreshold, ScheduledEvaluation, EvaluationTag, ChatThread, ChatMessage, AttendanceRecord, ScheduledBreak, SickLeave, EmployeeNote, WorkSchedule, ChatReadStatus, Task, Organization, Department, ActivityLogEntry, ShiftTemplate } from './types';

const allTools = [
    'recruitment', 'employees', 'attendance', 'attendanceAnalytics',
    'dashboard', 'evaluateEmployees', 'criteria', 'history', 'promotions', 'talentMatrix', 'flightRisk',
    'calendar', 'chat', 'tasks', 'compare', 'activityLog'
];

const organizations: Organization[] = [
    { id: 'org-1', name: 'TalentFlow Corp' },
];

const users: User[] = [
  { id: 'user-1', name: 'Admin', email: 'admin@talentflow.app', role: 'Admin', password: 'admin', enabledTools: allTools, organizationId: 'org-1' },
  { id: 'user-2', name: 'Elena Ríos', email: 'elena@talentflow.app', role: 'Usuario', password: '123', department: 'Tecnología', enabledTools: ['tasks', 'chat', 'calendar'], organizationId: 'org-1' },
  { id: 'user-3', name: 'Carlos Vega', email: 'carlos@talentflow.app', role: 'Usuario', password: '123', department: 'Ventas', enabledTools: ['tasks', 'chat', 'calendar', 'recruitment'], organizationId: 'org-1' }
];

const departments: Department[] = [
    { id: 'dept-1', name: 'Tecnología', organizationId: 'org-1' },
    { id: 'dept-2', name: 'Ventas', organizationId: 'org-1' },
    { id: 'dept-3', name: 'Recursos Humanos', organizationId: 'org-1' },
    { id: 'dept-4', name: 'Diseño', organizationId: 'org-1' },
    { id: 'dept-5', name: 'Marketing', organizationId: 'org-1' },
    { id: 'dept-6', name: 'Gestión de Proyectos', organizationId: 'org-1' },
];

const criteriaTemplates: CriteriaTemplate[] = [
  {
    id: 'template-1',
    name: 'Evaluación Técnica (Desarrollo)',
    organizationId: 'org-1',
    criteria: [
      {
        id: 'factor-1',
        name: 'Conocimiento Técnico',
        characteristics: [
          { id: 'char-1-1', name: 'Calidad del Código', weight: 1 },
          { id: 'char-1-2', name: 'Resolución de Problemas', weight: 0.9 },
          { id: 'char-1-3', name: 'Conocimiento de Frameworks', weight: 0.8 },
        ],
      },
      {
        id: 'factor-2',
        name: 'Habilidades Blandas',
        characteristics: [
          { id: 'char-2-1', name: 'Comunicación', weight: 0.7 },
          { id: 'char-2-2', name: 'Trabajo en Equipo', weight: 0.8 },
        ],
      },
    ],
  },
  {
    id: 'template-2',
    name: 'Evaluación de Ventas',
    organizationId: 'org-1',
    criteria: [
        {
            id: 'factor-3',
            name: 'Rendimiento de Ventas',
            characteristics: [
                { id: 'char-3-1', name: 'Cumplimiento de Cuotas', weight: 1 },
                { id: 'char-3-2', name: 'Generación de Leads', weight: 0.8 },
            ]
        },
        {
            id: 'factor-4',
            name: 'Habilidades Interpersonales',
            characteristics: [
                { id: 'char-4-1', name: 'Negociación', weight: 0.9 },
                { id: 'char-4-2', name: 'Relación con el Cliente', weight: 0.9 },
            ]
        }
    ]
  },
  {
    id: 'template-3',
    name: 'Evaluación Integral de Desempeño 360',
    organizationId: 'org-1',
    criteria: [
      {
        id: 'factor-comp-1',
        name: 'Competencias Técnicas y de Rol',
        characteristics: [
          { id: 'char-comp-1-1', name: 'Dominio de herramientas clave', weight: 1 },
          { id: 'char-comp-1-2', name: 'Aplicación de conocimientos técnicos', weight: 1 },
          { id: 'char-comp-1-3', name: 'Entendimiento del negocio/producto', weight: 0.8 },
          { id: 'char-comp-1-4', name: 'Búsqueda de actualización y aprendizaje', weight: 0.7 },
        ],
      },
      {
        id: 'factor-comp-2',
        name: 'Productividad y Calidad del Trabajo',
        characteristics: [
          { id: 'char-comp-2-1', name: 'Volumen de trabajo entregado', weight: 0.9 },
          { id: 'char-comp-2-2', name: 'Calidad y precisión de las entregas', weight: 1 },
          { id: 'char-comp-2-3', name: 'Cumplimiento de plazos', weight: 1 },
          { id: 'char-comp-2-4', name: 'Organización y gestión del tiempo', weight: 0.8 },
          { id: 'char-comp-2-5', name: 'Eficiencia en el uso de recursos', weight: 0.7 },
        ],
      },
      {
        id: 'factor-comp-3',
        name: 'Habilidades Interpersonales y Colaboración',
        characteristics: [
          { id: 'char-comp-3-1', name: 'Comunicación verbal y escrita', weight: 0.9 },
          { id: 'char-comp-3-2', name: 'Trabajo en equipo y cooperación', weight: 1 },
          { id: 'char-comp-3-3', name: 'Receptividad al feedback', weight: 0.9 },
          { id: 'char-comp-3-4', name: 'Resolución de conflictos', weight: 0.7 },
          { id: 'char-comp-3-5', name: 'Construcción de relaciones positivas', weight: 0.8 },
          { id: 'char-comp-3-6', name: 'Empatía y escucha activa', weight: 0.8 },
        ],
      },
      {
        id: 'factor-comp-4',
        name: 'Iniciativa y Autonomía',
        characteristics: [
          { id: 'char-comp-4-1', name: 'Proactividad en la búsqueda de soluciones', weight: 0.9 },
          { id: 'char-comp-4-2', name: 'Capacidad para trabajar sin supervisión constante', weight: 1 },
          { id: 'char-comp-4-3', name: 'Aporte de nuevas ideas y mejoras', weight: 0.8 },
          { id: 'char-comp-4-4', name: 'Toma de decisiones apropiadas al rol', weight: 0.9 },
        ],
      },
      {
        id: 'factor-comp-5',
        name: 'Alineación con la Cultura y Valores',
        characteristics: [
          { id: 'char-comp-5-1', name: 'Compromiso con la misión de la empresa', weight: 0.9 },
          { id: 'char-comp-5-2', name: 'Adaptabilidad al cambio', weight: 0.8 },
          { id: 'char-comp-5-3', name: 'Integridad y ética profesional', weight: 1 },
        ],
      },
    ],
  },
   {
    id: 'template-4',
    name: 'Evaluación Diseño UX/UI',
    organizationId: 'org-1',
    criteria: [
        { id: 'factor-ux-1', name: 'Investigación de Usuario', characteristics: [
            { id: 'char-ux-1-1', name: 'Análisis de Competencia', weight: 0.9 },
            { id: 'char-ux-1-2', name: 'Entrevistas con Usuarios', weight: 1.0 },
            { id: 'char-ux-1-3', name: 'Creación de Personas y User Journeys', weight: 0.8 },
            { id: 'char-ux-1-4', name: 'Pruebas de Usabilidad', weight: 1.0 },
        ]},
        { id: 'factor-ux-2', name: 'Diseño de Interfaz (UI)', characteristics: [
            { id: 'char-ux-2-1', name: 'Consistencia Visual y Branding', weight: 1.0 },
            { id: 'char-ux-2-2', name: 'Jerarquía Visual y Composición', weight: 0.9 },
            { id: 'char-ux-2-3', name: 'Uso de Color y Tipografía', weight: 0.8 },
            { id: 'char-ux-2-4', name: 'Diseño Responsivo y Adaptativo', weight: 0.9 },
            { id: 'char-ux-2-5', name: 'Atención al Detalle (Pixel Perfect)', weight: 0.7 },
        ]},
        { id: 'factor-ux-3', name: 'Diseño de Experiencia (UX)', characteristics: [
            { id: 'char-ux-3-1', name: 'Arquitectura de la Información', weight: 1.0 },
            { id: 'char-ux-3-2', name: 'Flujos de Usuario y Wireframing', weight: 1.0 },
            { id: 'char-ux-3-3', name: 'Resolución de Problemas del Usuario', weight: 0.9 },
            { id: 'char-ux-3-4', name: 'Microinteracciones y Feedback', weight: 0.8 },
            { id: 'char-ux-3-5', name: 'Accesibilidad (a11y)', weight: 0.9 },
        ]},
        { id: 'factor-ux-4', name: 'Herramientas y Prototipado', characteristics: [
            { id: 'char-ux-4-1', name: 'Dominio de Figma/Sketch/XD', weight: 1.0 },
            { id: 'char-ux-4-2', name: 'Prototipado Interactivo', weight: 0.9 },
            { id: 'char-ux-4-3', name: 'Creación y Mantenimiento de Sistemas de Diseño', weight: 0.8 },
        ]},
        { id: 'factor-ux-5', name: 'Colaboración y Comunicación', characteristics: [
            { id: 'char-ux-5-1', name: 'Hand-off a Desarrollo', weight: 1.0 },
            { id: 'char-ux-5-2', name: 'Presentación y Defensa de Diseños', weight: 0.9 },
            { id: 'char-ux-5-3', name: 'Receptividad a Críticas y Feedback', weight: 0.8 },
            { id: 'char-ux-5-4', name: 'Comunicación con Product Managers', weight: 0.9 },
        ]},
    ]
  },
  {
    id: 'template-5',
    name: 'Evaluación Gestión de Proyectos',
    organizationId: 'org-1',
    criteria: [
        { id: 'factor-pm-1', name: 'Planificación y Organización', characteristics: [
            { id: 'char-pm-1-1', name: 'Definición de Alcance y Objetivos', weight: 1.0 },
            { id: 'char-pm-1-2', name: 'Creación de Cronogramas (Gantt, etc.)', weight: 0.9 },
            { id: 'char-pm-1-3', name: 'Asignación de Recursos y Tareas', weight: 1.0 },
            { id: 'char-pm-1-4', name: 'Metodologías Ágiles (Scrum/Kanban)', weight: 0.8 },
        ]},
        { id: 'factor-pm-2', name: 'Liderazgo y Gestión de Equipo', characteristics: [
            { id: 'char-pm-2-1', name: 'Motivación y Cohesión del Equipo', weight: 1.0 },
            { id: 'char-pm-2-2', name: 'Delegación Efectiva', weight: 0.9 },
            { id: 'char-pm-2-3', name: 'Resolución de Conflictos Internos', weight: 0.8 },
            { id: 'char-pm-2-4', name: 'Mentoría y Desarrollo del Equipo', weight: 0.7 },
            { id: 'char-pm-2-5', name: 'Facilitación de Ceremonias Ágiles', weight: 0.9 },
        ]},
        { id: 'factor-pm-3', name: 'Gestión de Riesgos y Presupuesto', characteristics: [
            { id: 'char-pm-3-1', name: 'Identificación Proactiva de Riesgos', weight: 1.0 },
            { id: 'char-pm-3-2', name: 'Planes de Mitigación', weight: 0.9 },
            { id: 'char-pm-3-3', name: 'Control de Costos y Presupuesto', weight: 1.0 },
            { id: 'char-pm-3-4', name: 'Gestión del Cambio (Scope Creep)', weight: 0.9 },
        ]},
        { id: 'factor-pm-4', name: 'Comunicación con Stakeholders', characteristics: [
            { id: 'char-pm-4-1', name: 'Claridad en Reportes de Avance', weight: 1.0 },
            { id: 'char-pm-4-2', name: 'Gestión de Expectativas', weight: 1.0 },
            { id: 'char-pm-4-3', name: 'Habilidades de Negociación', weight: 0.8 },
        ]},
    ]
  },
  {
    id: 'template-6',
    name: 'Evaluación Marketing Digital',
    organizationId: 'org-1',
    criteria: [
        { id: 'factor-mkt-1', name: 'Estrategia de Contenidos', characteristics: [
            { id: 'char-mkt-1-1', name: 'Planificación de Calendario Editorial', weight: 1.0 },
            { id: 'char-mkt-1-2', name: 'Calidad de Copywriting', weight: 0.9 },
            { id: 'char-mkt-1-3', name: 'Adaptación a Formatos (Blog, Video, etc.)', weight: 0.8 },
            { id: 'char-mkt-1-4', name: 'Investigación de Palabras Clave', weight: 0.9 },
        ]},
        { id: 'factor-mkt-2', name: 'SEO y SEM', characteristics: [
            { id: 'char-mkt-2-1', name: 'Optimización On-Page y Off-Page', weight: 1.0 },
            { id: 'char-mkt-2-2', name: 'Estrategia de Link Building', weight: 0.7 },
            { id: 'char-mkt-2-3', name: 'Gestión de Campañas (Google Ads)', weight: 1.0 },
            { id: 'char-mkt-2-4', name: 'Análisis de SERPs', weight: 0.8 },
            { id: 'char-mkt-2-5', name: 'Optimización de Presupuesto (CPA, ROAS)', weight: 0.9 },
        ]},
        { id: 'factor-mkt-3', name: 'Redes Sociales y Comunidad', characteristics: [
            { id: 'char-mkt-3-1', name: 'Crecimiento de Audiencia e Interacción', weight: 0.9 },
            { id: 'char-mkt-3-2', name: 'Gestión de Crisis y Reputación', weight: 0.8 },
            { id: 'char-mkt-3-3', name: 'Creación de Contenido Nativo', weight: 1.0 },
            { id: 'char-mkt-3-4', name: 'Manejo de Pauta Publicitaria (Meta Ads, etc.)', weight: 0.9 },
        ]},
        { id: 'factor-mkt-4', name: 'Analítica y Métricas (KPIs)', characteristics: [
            { id: 'char-mkt-4-1', name: 'Dominio de Google Analytics / GA4', weight: 1.0 },
            { id: 'char-mkt-4-2', name: 'Creación de Dashboards y Reportes', weight: 0.9 },
            { id: 'char-mkt-4-3', name: 'Interpretación de Datos para la Toma de Decisiones', weight: 1.0 },
            { id: 'char-mkt-4-4', name: 'Seguimiento de Embudos de Conversión', weight: 0.9 },
            { id: 'char-mkt-4-5', name: 'Pruebas A/B', weight: 0.8 },
        ]},
        { id: 'factor-mkt-5', name: 'Creatividad e Innovación', characteristics: [
            { id: 'char-mkt-5-1', name: 'Generación de Ideas para Campañas', weight: 1.0 },
            { id: 'char-mkt-5-2', name: 'Adaptación a Nuevas Tendencias', weight: 0.9 },
            { id: 'char-mkt-5-3', name: 'Originalidad en la Comunicación', weight: 0.8 },
        ]},
        { id: 'factor-mkt-6', name: 'Gestión de Campañas', characteristics: [
            { id: 'char-mkt-6-1', name: 'Email Marketing y Automatización', weight: 0.9 },
            { id: 'char-mkt-6-2', name: 'Marketing de Afiliados', weight: 0.7 },
            { id: 'char-mkt-6-3', name: 'Coordinación Multicanal', weight: 1.0 },
            { id: 'char-mkt-6-4', name: 'Análisis Post-Campaña', weight: 0.9 },
        ]},
    ]
  }
];

const employees: Employee[] = [
    { id: 'emp-1', name: 'Ana Torres', role: 'Desarrolladora Senior', department: 'Tecnología', employeeCode: 'TC001', hireDate: '2021-03-15', email: 'ana.torres@example.com', organizationId: 'org-1' },
    { id: 'emp-2', name: 'Luis Gómez', role: 'Desarrollador Backend', department: 'Tecnología', employeeCode: 'TC002', hireDate: '2022-08-01', email: 'luis.gomez@example.com', organizationId: 'org-1' },
    { id: 'emp-3', name: 'Sofía Chen', role: 'Desarrolladora Frontend', department: 'Tecnología', employeeCode: 'TC003', hireDate: '2023-01-20', email: 'sofia.chen@example.com', organizationId: 'org-1' },
    { id: 'emp-4', name: 'David Kim', role: 'Analista QA', department: 'Tecnología', employeeCode: 'TC004', hireDate: '2022-11-05', email: 'david.kim@example.com', organizationId: 'org-1' },
    { id: 'emp-5', name: 'Jorge Nuñez', role: 'Gerente de Ventas', department: 'Ventas', employeeCode: 'VN001', hireDate: '2020-05-10', email: 'jorge.nunez@example.com', organizationId: 'org-1' },
    { id: 'emp-6', name: 'Patricia Morales', role: 'Ejecutiva de Cuentas', department: 'Ventas', employeeCode: 'VN002', hireDate: '2021-09-01', email: 'patricia.morales@example.com', organizationId: 'org-1' },
    { id: 'emp-7', name: 'Ricardo Palma', role: 'Ejecutivo de Cuentas Jr', department: 'Ventas', employeeCode: 'VN003', hireDate: '2023-06-12', email: 'ricardo.palma@example.com', organizationId: 'org-1' },
    { id: 'emp-8', name: 'Laura Méndez', role: 'Analista de Ventas', department: 'Ventas', employeeCode: 'VN004', hireDate: '2022-04-18', email: 'laura.mendez@example.com', organizationId: 'org-1' },
    { id: 'emp-9', name: 'Mónica Solano', role: 'Coordinadora de RRHH', department: 'Recursos Humanos', employeeCode: 'RH001', hireDate: '2019-10-01', email: 'monica.solano@example.com', organizationId: 'org-1' },
    { id: 'emp-10', name: 'Fernando Rojas', role: 'Reclutador', department: 'Recursos Humanos', employeeCode: 'RH002', hireDate: '2022-02-22', email: 'fernando.rojas@example.com', organizationId: 'org-1' },
    { id: 'emp-11', name: 'Clara Rivas', role: 'Diseñadora UX/UI Senior', department: 'Diseño', employeeCode: 'DS001', hireDate: '2021-07-19', email: 'clara.rivas@example.com', organizationId: 'org-1' },
    { id: 'emp-12', name: 'Mateo Castillo', role: 'Diseñador Gráfico', department: 'Diseño', employeeCode: 'DS002', hireDate: '2023-03-01', email: 'mateo.castillo@example.com', organizationId: 'org-1' },
    { id: 'emp-13', name: 'Isabel Flores', role: 'Investigadora UX', department: 'Diseño', employeeCode: 'DS003', hireDate: '2022-09-15', email: 'isabel.flores@example.com', organizationId: 'org-1' },
    { id: 'emp-14', name: 'Roberto Diaz', role: 'Líder Técnico', department: 'Tecnología', employeeCode: 'TC005', hireDate: '2020-02-18', email: 'roberto.diaz@example.com', organizationId: 'org-1' },
    { id: 'emp-15', name: 'Laura Fernandez', role: 'Directora de Arte', department: 'Diseño', employeeCode: 'DS004', hireDate: '2019-11-20', email: 'laura.fernandez@example.com', organizationId: 'org-1' },
    { id: 'emp-16', name: 'Sergio Martin', role: 'Key Account Manager', department: 'Ventas', employeeCode: 'VN005', hireDate: '2021-08-30', email: 'sergio.martin@example.com', organizationId: 'org-1' },
    { id: 'emp-17', name: 'Carolina Gil', role: 'Especialista en Compensaciones', department: 'Recursos Humanos', employeeCode: 'RH003', hireDate: '2022-05-16', email: 'carolina.gil@example.com', organizationId: 'org-1' },
    { id: 'emp-18', name: 'Valeria Luna', role: 'Diseñadora UX/UI Pleno', department: 'Diseño', employeeCode: 'DS005', hireDate: '2022-06-20', email: 'valeria.luna@example.com', organizationId: 'org-1' },
    { id: 'emp-19', name: 'Marco Peña', role: 'Project Manager', department: 'Gestión de Proyectos', employeeCode: 'GP001', hireDate: '2021-10-10', email: 'marco.pena@example.com', organizationId: 'org-1' },
    { id: 'emp-20', name: 'Andrea Salas', role: 'Especialista en Marketing Digital', department: 'Marketing', employeeCode: 'MKT001', hireDate: '2023-02-01', email: 'andrea.salas@example.com', organizationId: 'org-1' }
];

const applicants: Applicant[] = [
    { id: 'appl-1', name: 'Mario Luna', positionApplied: 'Desarrollador Frontend', status: 'En Proceso', applicationDate: '2024-05-10', department: 'Tecnología', organizationId: 'org-1' },
    { id: 'appl-2', name: 'Verónica Saenz', positionApplied: 'Ejecutiva de Cuentas', status: 'Nuevo', applicationDate: '2024-05-22', department: 'Ventas', organizationId: 'org-1' },
    { id: 'appl-3', name: 'Daniela Soto', positionApplied: 'Diseñadora Gráfica', status: 'Oferta', applicationDate: '2024-04-28', department: 'Diseño', organizationId: 'org-1' },
    { id: 'appl-4', name: 'Javier Prado', positionApplied: 'Desarrollador Backend', status: 'Rechazado', applicationDate: '2024-05-01', department: 'Tecnología', organizationId: 'org-1' },
    { id: 'appl-5', name: 'Lucía Kent', positionApplied: 'Reclutador', status: 'En Proceso', applicationDate: '2024-05-18', department: 'Recursos Humanos', organizationId: 'org-1' },
    { id: 'appl-6', name: 'Pedro Campos', positionApplied: 'Desarrollador Full-Stack', status: 'Nuevo', applicationDate: '2024-05-25', department: 'Tecnología', organizationId: 'org-1' },
    { id: 'appl-7', name: 'Gabriel Solis', positionApplied: 'Diseñador UX Junior', status: 'En Proceso', applicationDate: '2024-05-20', department: 'Diseño', organizationId: 'org-1' },
    { id: 'appl-8', name: 'Natalia Rojas', positionApplied: 'Manager de Redes Sociales', status: 'Nuevo', applicationDate: '2024-05-26', department: 'Marketing', organizationId: 'org-1' },
];

const evaluations: EvaluationResult[] = [
    // Ana Torres (emp-1), 3 evals, consistent high performer
    { id: 'eval-1', personId: 'emp-1', personType: 'employee', feedback: '### Resumen General\nAna sigue demostrando un rendimiento excepcional.', scores: [{characteristicId:'char-1-1', score:9},{characteristicId:'char-1-2', score:8},{characteristicId:'char-1-3', score:9},{characteristicId:'char-2-1', score:8},{characteristicId:'char-2-2', score:9}], mode:'Medio', evaluatedAt:'2023-11-15T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Alto', level:'Alto', calculatedScores:{overall:8.6, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:8.7},{factorId:'factor-2', factorName:'Habilidades Blandas', score:8.5}]}, organizationId:'org-1' },
    { id: 'eval-2', personId: 'emp-1', personType: 'employee', feedback: '### Resumen General\nExcelente como siempre, un pilar para el equipo.', scores: [{characteristicId:'char-1-1', score:9},{characteristicId:'char-1-2', score:9},{characteristicId:'char-1-3', score:9},{characteristicId:'char-2-1', score:8},{characteristicId:'char-2-2', score:9}], mode:'Riguroso', evaluatedAt:'2024-02-20T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Alto', level:'Alto', calculatedScores:{overall:8.8, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:9},{factorId:'factor-2', factorName:'Habilidades Blandas', score:8.5}]}, organizationId:'org-1' },
    { id: 'eval-14', personId: 'emp-1', personType: 'employee', feedback: '### Resumen General\nAna mantiene su alto estándar de calidad y liderazgo técnico.', scores: [{characteristicId:'char-1-1', score:10},{characteristicId:'char-1-2', score:9},{characteristicId:'char-1-3', score:9},{characteristicId:'char-2-1', score:9},{characteristicId:'char-2-2', score:9}], mode:'Riguroso', evaluatedAt:'2024-05-25T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Alto', level:'Alto', calculatedScores:{overall:9.2, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:9.3},{factorId:'factor-2', factorName:'Habilidades Blandas', score:9}]}, organizationId:'org-1' },

    // Luis Gómez (emp-2), 2 evals, declining performance (potential flight risk)
    { id: 'eval-3', personId: 'emp-2', personType: 'employee', feedback: '### Resumen General\nLuis muestra un buen potencial técnico.', scores: [{characteristicId:'char-1-1', score:8},{characteristicId:'char-1-2', score:7},{characteristicId:'char-1-3', score:7},{characteristicId:'char-2-1', score:6},{characteristicId:'char-2-2', score:7}], mode:'Medio', evaluatedAt:'2023-12-01T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Medio', level:'Medio', calculatedScores:{overall:7.1, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:7.3},{factorId:'factor-2', factorName:'Habilidades Blandas', score:6.5}]}, organizationId:'org-1' },
    { id: 'eval-4', personId: 'emp-2', personType: 'employee', feedback: '### Áreas de Mejora\nSe ha notado una baja en la proactividad y calidad del código.', scores: [{characteristicId:'char-1-1', score:6},{characteristicId:'char-1-2', score:5},{characteristicId:'char-1-3', score:6},{characteristicId:'char-2-1', score:5},{characteristicId:'char-2-2', score:6}], mode:'Medio', evaluatedAt:'2024-04-15T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Medio', level:'Bajo', calculatedScores:{overall:5.6, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:5.7},{factorId:'factor-2', factorName:'Habilidades Blandas', score:5.5}]}, organizationId:'org-1' },

    // Sofía Chen (emp-3), 2 evals, solid performer
    { id: 'eval-5', personId: 'emp-3', personType: 'employee', feedback: '### Resumen General\nSofía se ha adaptado muy bien al equipo.', scores: [{characteristicId:'char-1-1', score:7},{characteristicId:'char-1-2', score:8},{characteristicId:'char-1-3', score:7},{characteristicId:'char-2-1', score:8},{characteristicId:'char-2-2', score:8}], mode:'Medio', evaluatedAt:'2023-07-20T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Alto', level:'Medio', calculatedScores:{overall:7.6, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:7.3},{factorId:'factor-2', factorName:'Habilidades Blandas', score:8}]}, organizationId:'org-1' },
    { id: 'eval-6', personId: 'emp-3', personType: 'employee', feedback: '### Fortalezas Clave\nExcelente habilidad de comunicación y calidad de frontend.', scores: [{characteristicId:'char-1-1', score:8},{characteristicId:'char-1-2', score:8},{characteristicId:'char-1-3', score:8},{characteristicId:'char-2-1', score:9},{characteristicId:'char-2-2', score:8}], mode:'Riguroso', evaluatedAt:'2024-01-25T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Alto', level:'Alto', calculatedScores:{overall:8.2, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:8},{factorId:'factor-2', factorName:'Habilidades Blandas', score:8.5}]}, organizationId:'org-1' },
    
    // Jorge Nuñez (emp-5), 2 evals
    { id: 'eval-7', personId: 'emp-5', personType: 'employee', feedback: 'Resultados sólidos este trimestre.', scores: [{characteristicId:'char-3-1', score:9},{characteristicId:'char-3-2', score:7},{characteristicId:'char-4-1', score:8},{characteristicId:'char-4-2', score:9}], mode:'Riguroso', evaluatedAt:'2023-10-10T10:00:00Z', criteria:criteriaTemplates[1].criteria, potential:'Medio', level:'Alto', calculatedScores:{overall:8.2, factors:[{factorId:'factor-3', factorName:'Rendimiento de Ventas', score:8.1},{factorId:'factor-4', factorName:'Habilidades Interpersonales', score:8.5}]}, organizationId:'org-1' },
    { id: 'eval-8', personId: 'emp-5', personType: 'employee', feedback: 'Mantiene el buen rendimiento del equipo.', scores: [{characteristicId:'char-3-1', score:8},{characteristicId:'char-3-2', score:8},{characteristicId:'char-4-1', score:9},{characteristicId:'char-4-2', score:8}], mode:'Riguroso', evaluatedAt:'2024-01-15T10:00:00Z', criteria:criteriaTemplates[1].criteria, potential:'Medio', level:'Alto', calculatedScores:{overall:8.2, factors:[{factorId:'factor-3', factorName:'Rendimiento de Ventas', score:8},{factorId:'factor-4', factorName:'Habilidades Interpersonales', score:8.5}]}, organizationId:'org-1' },

    // Patricia Morales (emp-6), 2 evals
    { id: 'eval-9', personId: 'emp-6', personType: 'employee', feedback: 'Patricia tiene un gran potencial para crecer.', scores: [{characteristicId:'char-3-1', score:7},{characteristicId:'char-3-2', score:8},{characteristicId:'char-4-1', score:7},{characteristicId:'char-4-2', score:8}], mode:'Medio', evaluatedAt:'2023-11-20T10:00:00Z', criteria:criteriaTemplates[1].criteria, potential:'Alto', level:'Medio', calculatedScores:{overall:7.5, factors:[{factorId:'factor-3', factorName:'Rendimiento de Ventas', score:7.4},{factorId:'factor-4', factorName:'Habilidades Interpersonales', score:7.5}]}, organizationId:'org-1' },
    { id: 'eval-10', personId: 'emp-6', personType: 'employee', feedback: 'Ha superado las cuotas este trimestre. Excelente.', scores: [{characteristicId:'char-3-1', score:9},{characteristicId:'char-3-2', score:8},{characteristicId:'char-4-1', score:8},{characteristicId:'char-4-2', score:9}], mode:'Medio', evaluatedAt:'2024-03-22T10:00:00Z', criteria:criteriaTemplates[1].criteria, potential:'Alto', level:'Alto', calculatedScores:{overall:8.5, factors:[{factorId:'factor-3', factorName:'Rendimiento de Ventas', score:8.5},{factorId:'factor-4', factorName:'Habilidades Interpersonales', score:8.5}]}, organizationId:'org-1' },
    
    // Clara Rivas (emp-11), 2 evals
    { id: 'eval-11', personId: 'emp-11', personType: 'employee', feedback: 'Diseños de alta calidad.', scores: [{characteristicId:'char-1-1', score:9},{characteristicId:'char-1-2', score:8},{characteristicId:'char-1-3', score:8},{characteristicId:'char-2-1', score:7},{characteristicId:'char-2-2', score:8}], mode:'Riguroso', evaluatedAt:'2023-09-05T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Alto', level:'Alto', calculatedScores:{overall:8.1, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:8.3},{factorId:'factor-2', factorName:'Habilidades Blandas', score:7.5}]}, organizationId:'org-1' },
    { id: 'eval-12', personId: 'emp-11', personType: 'employee', feedback: 'Lidera la iniciativa de diseño del nuevo proyecto.', scores: [{characteristicId:'char-1-1', score:9},{characteristicId:'char-1-2', score:9},{characteristicId:'char-1-3', score:8},{characteristicId:'char-2-1', score:8},{characteristicId:'char-2-2', score:8}], mode:'Riguroso', evaluatedAt:'2024-02-10T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Alto', level:'Alto', calculatedScores:{overall:8.4, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:8.7},{factorId:'factor-2', factorName:'Habilidades Blandas', score:8}]}, organizationId:'org-1' },
    
    // Mateo Castillo (emp-12), 2 evals
    { id: 'eval-13', personId: 'emp-12', personType: 'employee', feedback: 'Bajo desempeño, necesita mejorar.', scores: [{characteristicId:'char-1-1', score:4},{characteristicId:'char-1-2', score:5},{characteristicId:'char-1-3', score:4},{characteristicId:'char-2-1', score:6},{characteristicId:'char-2-2', score:5}], mode:'Bajo', evaluatedAt:'2024-03-15T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Bajo', level:'Bajo', calculatedScores:{overall:4.8, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:4.3},{factorId:'factor-2', factorName:'Habilidades Blandas', score:5.5}]}, organizationId:'org-1' },
    { id: 'eval-15', personId: 'emp-12', personType: 'employee', feedback: 'Sigue en un nivel bajo, se requiere plan de acción.', scores: [{characteristicId:'char-1-1', score:4},{characteristicId:'char-1-2', score:4},{characteristicId:'char-1-3', score:5},{characteristicId:'char-2-1', score:5},{characteristicId:'char-2-2', score:5}], mode:'Medio', evaluatedAt:'2024-05-20T10:00:00Z', criteria:criteriaTemplates[0].criteria, potential:'Bajo', level:'Bajo', calculatedScores:{overall:4.5, factors:[{factorId:'factor-1', factorName:'Conocimiento Técnico', score:4.3},{factorId:'factor-2', factorName:'Habilidades Blandas', score:5}]}, organizationId:'org-1' },

    // New detailed evaluations
    {
      id: 'eval-16', personId: 'emp-14', personType: 'employee', feedback: 'Roberto es un líder técnico sólido con un profundo conocimiento y una excelente capacidad de colaboración. Su desempeño es consistentemente alto.',
      scores: [
        { characteristicId: 'char-comp-1-1', score: 9 }, { characteristicId: 'char-comp-1-2', score: 8 }, { characteristicId: 'char-comp-1-3', score: 8 }, { characteristicId: 'char-comp-1-4', score: 9 },
        { characteristicId: 'char-comp-2-1', score: 8 }, { characteristicId: 'char-comp-2-2', score: 9 }, { characteristicId: 'char-comp-2-3', score: 9 }, { characteristicId: 'char-comp-2-4', score: 8 }, { characteristicId: 'char-comp-2-5', score: 7 },
        { characteristicId: 'char-comp-3-1', score: 9 }, { characteristicId: 'char-comp-3-2', score: 10 }, { characteristicId: 'char-comp-3-3', score: 8 }, { characteristicId: 'char-comp-3-4', score: 7 }, { characteristicId: 'char-comp-3-5', score: 9 }, { characteristicId: 'char-comp-3-6', score: 8 },
        { characteristicId: 'char-comp-4-1', score: 9 }, { characteristicId: 'char-comp-4-2', score: 9 }, { characteristicId: 'char-comp-4-3', score: 8 }, { characteristicId: 'char-comp-4-4', score: 9 },
        { characteristicId: 'char-comp-5-1', score: 9 }, { characteristicId: 'char-comp-5-2', score: 8 }, { characteristicId: 'char-comp-5-3', score: 10 },
      ],
      mode: 'Riguroso', evaluatedAt: '2024-05-15T11:00:00Z', criteria: criteriaTemplates[2].criteria, potential: 'Alto', level: 'Alto',
      calculatedScores: { overall: 8.52, factors: [
          { factorId: 'factor-comp-1', factorName: 'Competencias Técnicas y de Rol', score: 8.5 }, { factorId: 'factor-comp-2', factorName: 'Productividad y Calidad del Trabajo', score: 8.2 },
          { factorId: 'factor-comp-3', factorName: 'Habilidades Interpersonales y Colaboración', score: 8.5 }, { factorId: 'factor-comp-4', factorName: 'Iniciativa y Autonomía', score: 8.75 },
          { factorId: 'factor-comp-5', factorName: 'Alineación con la Cultura y Valores', score: 9.0 },
      ]}, organizationId:'org-1'
    },
    {
        id: 'eval-17', personId: 'emp-15', personType: 'employee', feedback: 'Laura demuestra una visión creativa excepcional y una gran capacidad de liderazgo en el equipo de diseño. Hay oportunidades para mejorar la gestión de plazos en proyectos complejos.',
        scores: [
          { characteristicId: 'char-comp-1-1', score: 10 }, { characteristicId: 'char-comp-1-2', score: 9 }, { characteristicId: 'char-comp-1-3', score: 9 }, { characteristicId: 'char-comp-1-4', score: 8 },
          { characteristicId: 'char-comp-2-1', score: 7 }, { characteristicId: 'char-comp-2-2', score: 9 }, { characteristicId: 'char-comp-2-3', score: 6 }, { characteristicId: 'char-comp-2-4', score: 7 }, { characteristicId: 'char-comp-2-5', score: 8 },
          { characteristicId: 'char-comp-3-1', score: 9 }, { characteristicId: 'char-comp-3-2', score: 9 }, { characteristicId: 'char-comp-3-3', score: 8 }, { characteristicId: 'char-comp-3-4', score: 8 }, { characteristicId: 'char-comp-3-5', score: 9 }, { characteristicId: 'char-comp-3-6', score: 9 },
          { characteristicId: 'char-comp-4-1', score: 10 }, { characteristicId: 'char-comp-4-2', score: 8 }, { characteristicId: 'char-comp-4-3', score: 9 }, { characteristicId: 'char-comp-4-4', score: 8 },
          { characteristicId: 'char-comp-5-1', score: 9 }, { characteristicId: 'char-comp-5-2', score: 7 }, { characteristicId: 'char-comp-5-3', score: 9 },
        ],
        mode: 'Medio', evaluatedAt: '2024-05-18T14:00:00Z', criteria: criteriaTemplates[2].criteria, potential: 'Alto', level: 'Alto',
        calculatedScores: { overall: 8.36, factors: [
            { factorId: 'factor-comp-1', factorName: 'Competencias Técnicas y de Rol', score: 9.0 }, { factorId: 'factor-comp-2', factorName: 'Productividad y Calidad del Trabajo', score: 7.4 },
            { factorId: 'factor-comp-3', factorName: 'Habilidades Interpersonales y Colaboración', score: 8.67 }, { factorId: 'factor-comp-4', factorName: 'Iniciativa y Autonomía', score: 8.75 },
            { factorId: 'factor-comp-5', factorName: 'Alineación con la Cultura y Valores', score: 8.33 },
        ]}, organizationId: 'org-1'
    },
    {
        id: 'eval-18', personId: 'emp-17', personType: 'employee', feedback: 'Carolina tiene un desempeño sólido y consistente. Cumple con sus responsabilidades de manera efectiva, pero se beneficiaría de tomar más iniciativa en proyectos fuera de su alcance inmediato.',
        scores: [
          { characteristicId: 'char-comp-1-1', score: 8 }, { characteristicId: 'char-comp-1-2', score: 7 }, { characteristicId: 'char-comp-1-3', score: 7 }, { characteristicId: 'char-comp-1-4', score: 6 },
          { characteristicId: 'char-comp-2-1', score: 8 }, { characteristicId: 'char-comp-2-2', score: 8 }, { characteristicId: 'char-comp-2-3', score: 9 }, { characteristicId: 'char-comp-2-4', score: 7 }, { characteristicId: 'char-comp-2-5', score: 7 },
          { characteristicId: 'char-comp-3-1', score: 8 }, { characteristicId: 'char-comp-3-2', score: 8 }, { characteristicId: 'char-comp-3-3', score: 7 }, { characteristicId: 'char-comp-3-4', score: 6 }, { characteristicId: 'char-comp-3-5', score: 7 }, { characteristicId: 'char-comp-3-6', score: 8 },
          { characteristicId: 'char-comp-4-1', score: 5 }, { characteristicId: 'char-comp-4-2', score: 8 }, { characteristicId: 'char-comp-4-3', score: 5 }, { characteristicId: 'char-comp-4-4', score: 6 },
          { characteristicId: 'char-comp-5-1', score: 8 }, { characteristicId: 'char-comp-5-2', score: 7 }, { characteristicId: 'char-comp-5-3', score: 9 },
        ],
        mode: 'Medio', evaluatedAt: '2024-05-20T09:30:00Z', criteria: criteriaTemplates[2].criteria, potential: 'Medio', level: 'Medio',
        calculatedScores: { overall: 7.14, factors: [
            { factorId: 'factor-comp-1', factorName: 'Competencias Técnicas y de Rol', score: 7.0 }, { factorId: 'factor-comp-2', factorName: 'Productividad y Calidad del Trabajo', score: 7.8 },
            { factorId: 'factor-comp-3', factorName: 'Habilidades Interpersonales y Colaboración', score: 7.33 }, { factorId: 'factor-comp-4', factorName: 'Iniciativa y Autonomía', score: 6.0 },
            { factorId: 'factor-comp-5', factorName: 'Alineación con la Cultura y Valores', score: 8.0 },
        ]}, organizationId: 'org-1'
    },
    {
        id: 'eval-19', personId: 'emp-18', personType: 'employee', feedback: 'Valeria tiene un gran ojo para el detalle y una fuerte comprensión de los principios de UX. Su trabajo en la interfaz del nuevo módulo fue excepcional.',
        scores: [
            { id: 'char-ux-1-1', score: 8 }, { id: 'char-ux-1-2', score: 9 }, { id: 'char-ux-1-3', score: 8 }, { id: 'char-ux-1-4', score: 9 },
            { id: 'char-ux-2-1', score: 9 }, { id: 'char-ux-2-2', score: 9 }, { id: 'char-ux-2-3', score: 8 }, { id: 'char-ux-2-4', score: 9 }, { id: 'char-ux-2-5', score: 8 },
            { id: 'char-ux-3-1', score: 9 }, { id: 'char-ux-3-2', score: 8 }, { id: 'char-ux-3-3', score: 9 }, { id: 'char-ux-3-4', score: 8 }, { id: 'char-ux-3-5', score: 9 },
            { id: 'char-ux-4-1', score: 9 }, { id: 'char-ux-4-2', score: 9 }, { id: 'char-ux-4-3', score: 8 },
            { id: 'char-ux-5-1', score: 9 }, { id: 'char-ux-5-2', score: 8 }, { id: 'char-ux-5-3', score: 8 }, { id: 'char-ux-5-4', score: 9 },
        ].map(s => ({ characteristicId: s.id, score: s.score })),
        mode: 'Riguroso', evaluatedAt: '2024-05-22T10:00:00Z', criteria: criteriaTemplates[3].criteria, potential: 'Alto', level: 'Alto',
        calculatedScores: { overall: 8.60, factors: [
            { factorId: 'factor-ux-1', factorName: 'Investigación de Usuario', score: 8.54 },
            { factorId: 'factor-ux-2', factorName: 'Diseño de Interfaz (UI)', score: 8.65 },
            { factorId: 'factor-ux-3', factorName: 'Diseño de Experiencia (UX)', score: 8.61 },
            { factorId: 'factor-ux-4', factorName: 'Herramientas y Prototipado', score: 8.70 },
            { factorId: 'factor-ux-5', factorName: 'Colaboración y Comunicación', score: 8.53 },
        ]}, organizationId: 'org-1'
    },
    {
        id: 'eval-20', personId: 'emp-19', personType: 'employee', feedback: 'Marco es un organizador eficaz y mantiene al equipo enfocado. Necesita mejorar la comunicación proactiva de riesgos a los stakeholders.',
        scores: [
            { id: 'char-pm-1-1', score: 8 }, { id: 'char-pm-1-2', score: 7 }, { id: 'char-pm-1-3', score: 8 }, { id: 'char-pm-1-4', score: 7 },
            { id: 'char-pm-2-1', score: 8 }, { id: 'char-pm-2-2', score: 9 }, { id: 'char-pm-2-3', score: 7 }, { id: 'char-pm-2-4', score: 6 }, { id: 'char-pm-2-5', score: 8 },
            { id: 'char-pm-3-1', score: 6 }, { id: 'char-pm-3-2', score: 7 }, { id: 'char-pm-3-3', score: 8 }, { id: 'char-pm-3-4', score: 7 },
            { id: 'char-pm-4-1', score: 6 }, { id: 'char-pm-4-2', score: 7 }, { id: 'char-pm-4-3', score: 7 },
        ].map(s => ({ characteristicId: s.id, score: s.score })),
        mode: 'Medio', evaluatedAt: '2024-04-30T10:00:00Z', criteria: criteriaTemplates[4].criteria, potential: 'Medio', level: 'Medio',
        calculatedScores: { overall: 7.28, factors: [
            { factorId: 'factor-pm-1', factorName: 'Planificación y Organización', score: 7.51 },
            { factorId: 'factor-pm-2', factorName: 'Liderazgo y Gestión de Equipo', score: 7.68 },
            { factorId: 'factor-pm-3', factorName: 'Gestión de Riesgos y Presupuesto', score: 7.03 },
            { factorId: 'factor-pm-4', factorName: 'Comunicación con Stakeholders', score: 6.64 },
        ]}, organizationId: 'org-1'
    },
    {
        id: 'eval-21', personId: 'emp-20', personType: 'employee', feedback: 'Andrea ha demostrado una rápida adaptación y un gran entusiasmo. Sus habilidades analíticas son un punto fuerte, con potencial para liderar campañas en el futuro.',
        scores: [
            { id: 'char-mkt-1-1', score: 8 }, { id: 'char-mkt-1-2', score: 7 }, { id: 'char-mkt-1-3', score: 8 }, { id: 'char-mkt-1-4', score: 9 },
            { id: 'char-mkt-2-1', score: 7 }, { id: 'char-mkt-2-2', score: 6 }, { id: 'char-mkt-2-3', score: 8 }, { id: 'char-mkt-2-4', score: 7 }, { id: 'char-mkt-2-5', score: 8 },
            { id: 'char-mkt-3-1', score: 9 }, { id: 'char-mkt-3-2', score: 7 }, { id: 'char-mkt-3-3', score: 8 }, { id: 'char-mkt-3-4', score: 8 },
            { id: 'char-mkt-4-1', score: 9 }, { id: 'char-mkt-4-2', score: 8 }, { id: 'char-mkt-4-3', score: 9 }, { id: 'char-mkt-4-4', score: 8 }, { id: 'char-mkt-4-5', score: 7 },
            { id: 'char-mkt-5-1', score: 9 }, { id: 'char-mkt-5-2', score: 8 }, { id: 'char-mkt-5-3', score: 8 },
            { id: 'char-mkt-6-1', score: 7 }, { id: 'char-mkt-6-2', score: 6 }, { id: 'char-mkt-6-3', score: 8 }, { id: 'char-mkt-6-4', score: 8 },
        ].map(s => ({ characteristicId: s.id, score: s.score })),
        mode: 'Medio', evaluatedAt: '2024-05-15T10:00:00Z', criteria: criteriaTemplates[5].criteria, potential: 'Alto', level: 'Alto',
        calculatedScores: { overall: 7.82, factors: [
            { factorId: 'factor-mkt-1', factorName: 'Estrategia de Contenidos', score: 8.03 },
            { factorId: 'factor-mkt-2', factorName: 'SEO y SEM', score: 7.32 },
            { factorId: 'factor-mkt-3', factorName: 'Redes Sociales y Comunidad', score: 8.03 },
            { factorId: 'factor-mkt-4', factorName: 'Analítica y Métricas (KPIs)', score: 8.16 },
            { factorId: 'factor-mkt-5', factorName: 'Creatividad e Innovación', score: 8.44 },
            { factorId: 'factor-mkt-6', factorName: 'Gestión de Campañas', score: 7.41 },
        ]}, organizationId: 'org-1'
    },
    {
        id: 'eval-22', personId: 'appl-7', personType: 'applicant', feedback: 'Gabriel tiene una base sólida en principios de UX y buenas habilidades de prototipado. Necesitará fortalecer su experiencia en investigación cuantitativa.',
        scores: [
            { id: 'char-ux-1-1', score: 7 }, { id: 'char-ux-1-2', score: 8 }, { id: 'char-ux-1-3', score: 7 }, { id: 'char-ux-1-4', score: 6 },
            { id: 'char-ux-2-1', score: 8 }, { id: 'char-ux-2-2', score: 7 }, { id: 'char-ux-2-3', score: 8 }, { id: 'char-ux-2-4', score: 7 }, { id: 'char-ux-2-5', score: 8 },
            { id: 'char-ux-3-1', score: 7 }, { id: 'char-ux-3-2', score: 8 }, { id: 'char-ux-3-3', score: 8 }, { id: 'char-ux-3-4', score: 6 }, { id: 'char-ux-3-5', score: 7 },
            { id: 'char-ux-4-1', score: 9 }, { id: 'char-ux-4-2', score: 8 }, { id: 'char-ux-4-3', score: 6 },
            { id: 'char-ux-5-1', score: 7 }, { id: 'char-ux-5-2', score: 8 }, { id: 'char-ux-5-3', score: 9 }, { id: 'char-ux-5-4', score: 7 },
        ].map(s => ({ characteristicId: s.id, score: s.score })),
        mode: 'Medio', evaluatedAt: '2024-05-23T15:00:00Z', criteria: criteriaTemplates[3].criteria, potential: 'Alto', level: 'Medio',
        calculatedScores: { overall: 7.42, factors: [
            { factorId: 'factor-ux-1', factorName: 'Investigación de Usuario', score: 6.97 },
            { factorId: 'factor-ux-2', factorName: 'Diseño de Interfaz (UI)', score: 7.56 },
            { factorId: 'factor-ux-3', factorName: 'Diseño de Experiencia (UX)', score: 7.20 },
            { factorId: 'factor-ux-4', factorName: 'Herramientas y Prototipado', score: 7.81 },
            { factorId: 'factor-ux-5', factorName: 'Colaboración y Comunicación', score: 7.72 },
        ]}, organizationId: 'org-1'
    },
    {
        id: 'eval-23', personId: 'appl-8', personType: 'applicant', feedback: 'Natalia es muy creativa y tiene buenas ideas para contenido en redes sociales. Sin embargo, su conocimiento en la parte analítica y de gestión de pauta es un área de oportunidad clara.',
        scores: [
            { id: 'char-mkt-1-1', score: 8 }, { id: 'char-mkt-1-2', score: 9 }, { id: 'char-mkt-1-3', score: 8 }, { id: 'char-mkt-1-4', score: 6 },
            { id: 'char-mkt-2-1', score: 5 }, { id: 'char-mkt-2-2', score: 4 }, { id: 'char-mkt-2-3', score: 6 }, { id: 'char-mkt-2-4', score: 5 }, { id: 'char-mkt-2-5', score: 5 },
            { id: 'char-mkt-3-1', score: 9 }, { id: 'char-mkt-3-2', score: 7 }, { id: 'char-mkt-3-3', score: 9 }, { id: 'char-mkt-3-4', score: 6 },
            { id: 'char-mkt-4-1', score: 5 }, { id: 'char-mkt-4-2', score: 6 }, { id: 'char-mkt-4-3', score: 5 }, { id: 'char-mkt-4-4', score: 6 }, { id: 'char-mkt-4-5', score: 4 },
            { id: 'char-mkt-5-1', score: 9 }, { id: 'char-mkt-5-2', score: 8 }, { id: 'char-mkt-5-3', score: 9 },
            { id: 'char-mkt-6-1', score: 7 }, { id: 'char-mkt-6-2', score: 5 }, { id: 'char-mkt-6-3', score: 6 }, { id: 'char-mkt-6-4', score: 6 },
        ].map(s => ({ characteristicId: s.id, score: s.score })),
        mode: 'Bajo', evaluatedAt: '2024-05-27T12:00:00Z', criteria: criteriaTemplates[5].criteria, potential: 'Medio', level: 'Medio',
        calculatedScores: { overall: 6.56, factors: [
            { factorId: 'factor-mkt-1', factorName: 'Estrategia de Contenidos', score: 7.74 },
            { factorId: 'factor-mkt-2', factorName: 'SEO y SEM', score: 5.12 },
            { factorId: 'factor-mkt-3', factorName: 'Redes Sociales y Comunidad', score: 7.76 },
            { factorId: 'factor-mkt-4', factorName: 'Analítica y Métricas (KPIs)', score: 5.16 },
            { factorId: 'factor-mkt-5', factorName: 'Creatividad e Innovación', score: 8.78 },
            { factorId: 'factor-mkt-6', factorName: 'Gestión de Campañas', score: 6.15 },
        ]}, organizationId: 'org-1'
    },
];

const scheduledEvaluations: ScheduledEvaluation[] = [
    { id: 'se-1', title: 'Evaluación Trimestral Q1', start: '2024-03-01', end: '2024-03-15', targetType: 'department', targetId: 'Tecnología', participantIds: [], creatorId: 'user-1', tagId: 'tag-1', organizationId: 'org-1' },
    { id: 'se-2', title: 'Revisión Anual de Desempeño', start: '2024-06-15', end: '2024-06-30', targetType: 'general', targetId: 'all', participantIds: [], creatorId: 'user-1', tagId: 'tag-2', organizationId: 'org-1' },
    { id: 'se-3', title: 'Seguimiento de Objetivos de Ventas', start: '2024-05-28', end: '2024-05-28', targetType: 'users', targetId: 'all', participantIds: ['user-1', 'user-3'], creatorId: 'user-1', tagId: 'tag-3', organizationId: 'org-1' },
];

const chatThreads: ChatThread[] = [
    { id: 'thread-1', participantIds: ['user-1', 'user-2', 'emp-1', 'emp-2', 'emp-3', 'emp-4'], isGroup: true, name: 'Equipo de Tecnología', organizationId: 'org-1' },
    { id: 'thread-2', participantIds: ['user-1', 'user-3'], isGroup: false, organizationId: 'org-1' },
];

const chatMessages: ChatMessage[] = [
    { id: 'msg-1', chatId: 'thread-1', senderId: 'user-1', text: 'Hola equipo, ¿cómo va el sprint?', timestamp: '2024-05-24T14:30:00Z' },
    { id: 'msg-2', chatId: 'thread-1', senderId: 'emp-1', text: '¡Todo bien por acá! Terminando el feature A.', timestamp: '2024-05-24T14:31:00Z' },
    { id: 'msg-3', chatId: 'thread-2', senderId: 'user-3', text: 'Admin, necesito revisar las proyecciones de venta.', timestamp: '2024-05-25T11:00:00Z' },
    { id: 'msg-4', chatId: 'thread-2', senderId: 'user-1', text: 'Claro, te las envío en un momento.', timestamp: '2024-05-25T11:02:00Z' },
];

const chatReadStatuses: ChatReadStatus[] = [];

// --- ATTENDANCE DATA (last 30 days) ---
const today = new Date();
const attendanceRecords: AttendanceRecord[] = [];
const workSchedules: WorkSchedule[] = [];

const employeesToTrack = ['emp-1', 'emp-2', 'emp-5', 'emp-6', 'emp-11', 'emp-12'];
for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    if (dayOfWeek > 0 && dayOfWeek < 6) { // Monday to Friday
        employeesToTrack.forEach(empId => {
            workSchedules.push({ id: `ws-${empId}-${dateStr}`, employeeId: empId, date: dateStr, startTime: '09:00', endTime: '18:00', organizationId: 'org-1' });
            
            // Luis Gómez (emp-2) has some lates
            if (empId === 'emp-2' && (dayOfWeek === 1 || dayOfWeek === 3)) {
                attendanceRecords.push({ id: `att-${empId}-${dateStr}`, employeeId: empId, date: dateStr, clockIn: '09:15', clockOut: '18:05', status: 'Atrasado', organizationId: 'org-1' });
            } 
            // Jorge Nuñez (emp-5) has some absences
            else if (empId === 'emp-5' && dayOfWeek === 4) {
                 attendanceRecords.push({ id: `att-${empId}-${dateStr}`, employeeId: empId, date: dateStr, clockIn: null, clockOut: null, status: 'Ausente', organizationId: 'org-1' });
            }
            // Other employees are on time
            else {
                 attendanceRecords.push({ id: `att-${empId}-${dateStr}`, employeeId: empId, date: dateStr, clockIn: '08:58', clockOut: '18:02', status: 'Presente', organizationId: 'org-1' });
            }
        });
    }
}


const scheduledBreaks: ScheduledBreak[] = [
    { id: 'break-1', employeeId: 'emp-6', startDate: '2024-05-13', endDate: '2024-05-17', type: 'Vacaciones', organizationId: 'org-1' }
];

const sickLeaves: SickLeave[] = [
    { id: 'sick-1', employeeId: 'emp-4', date: '2024-05-20', reason: 'Gripe', organizationId: 'org-1' }
];

const employeeNotes: EmployeeNote[] = [
    { id: 'note-1', employeeId: 'emp-2', authorId: 'user-1', text: 'Se discutió el plan de mejora de rendimiento. Mostró buena disposición.', timestamp: '2024-04-16T15:00:00Z', organizationId: 'org-1' },
    { id: 'note-2', employeeId: 'emp-6', authorId: 'user-3', text: 'Felicitaciones por cerrar el trato con Acme Corp. Gran trabajo.', timestamp: '2024-03-25T09:00:00Z', organizationId: 'org-1' },
];


const tasks: Task[] = [
    { id: 'task-1', title: 'Desplegar nueva feature de login', status: 'En Progreso', priority: 'Alta', dueDate: '2024-06-10', createdAt: '2024-05-20T10:00:00Z', creatorId: 'user-1', assigneeIds: ['emp-1', 'emp-3'], departmentTags: ['Tecnología'], subtasks: [{id:'st-1', text:'Pruebas finales', completed: false}], organizationId: 'org-1' },
    { id: 'task-2', title: 'Preparar reporte de ventas Q2', status: 'Pendiente', priority: 'Media', dueDate: '2024-06-15', createdAt: '2024-05-22T11:00:00Z', creatorId: 'user-3', assigneeIds: ['emp-8'], departmentTags: ['Ventas'], subtasks: [], organizationId: 'org-1' },
    { id: 'task-3', title: 'Organizar evento de integración de mitad de año', status: 'Completada', priority: 'Baja', dueDate: '2024-05-25', createdAt: '2024-04-15T09:00:00Z', creatorId: 'user-1', assigneeIds: ['emp-9'], departmentTags: ['Recursos Humanos'], subtasks: [{id:'st-2', text:'Reservar lugar', completed: true}, {id:'st-3', text:'Enviar invitaciones', completed: true}], organizationId: 'org-1' }
];

const levelThresholds: LevelThreshold[] = [
    { name: 'Bajo', threshold: 4 },
    { name: 'Medio', threshold: 7 },
    { name: 'Alto', threshold: 10 }
];

const evaluationTags: EvaluationTag[] = [
    { id: 'tag-1', name: 'Trimestral', color: 'bg-blue-500/50' },
    { id: 'tag-2', name: 'Anual', color: 'bg-green-500/50' },
    { id: 'tag-3', name: 'Seguimiento', color: 'bg-yellow-500/50' },
    { id: 'tag-4', name: 'Entrevista', color: 'bg-purple-500/50' },
];

const shiftTemplates: ShiftTemplate[] = [
    { id: 'st-1', organizationId: 'org-1', name: 'Turno de Día (8h)', startTime: '09:00', endTime: '17:00', color: 'bg-sky-500/20' },
    { id: 'st-2', organizationId: 'org-1', name: 'Jornada Completa (9h)', startTime: '09:00', endTime: '18:00', color: 'bg-blue-500/20' },
    { id: 'st-3', organizationId: 'org-1', name: 'Turno de Tarde (6h)', startTime: '14:00', endTime: '20:00', color: 'bg-amber-500/20' },
    { id: 'st-4', organizationId: 'org-1', name: 'Turno Nocturno (12h)', startTime: '20:00', endTime: '08:00', color: 'bg-indigo-500/20' },
]

const activityLog: ActivityLogEntry[] = [];


export const initialData = {
  organizations,
  users,
  employees,
  applicants,
  criteriaTemplates,
  evaluations,
  departments,
  levelThresholds,
  scheduledEvaluations,
  evaluationTags,
  chatThreads,
  chatMessages,
  chatReadStatuses,
  attendanceRecords,
  scheduledBreaks,
  sickLeaves,
  employeeNotes,
  workSchedules,
  tasks,
  activityLog,
  shiftTemplates,
};