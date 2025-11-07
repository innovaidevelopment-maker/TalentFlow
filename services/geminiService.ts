import { GoogleGenAI, Type } from "@google/genai";
import type { Employee, Applicant, Factor, EvaluationScore, EvaluationMode } from '../types';

export const generateFeedback = async (
  person: Employee | Applicant,
  criteria: Factor[],
  scores: EvaluationScore[],
  mode: EvaluationMode
): Promise<string> => {
  // Fix: Initialize the client here to prevent a crash on app load
  // when `process.env` is not available at the module's top level.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const scoresMap = new Map(scores.map(s => [s.characteristicId, s.score]));
    
    const isEmployee = 'employeeCode' in person;
    const position = isEmployee ? (person as Employee).role : (person as Applicant).positionApplied;

    const systemInstruction = `Actúa como un experto en Recursos Humanos y un director de contratación experimentado. Tu tarea es escribir una retroalimentación de evaluación.`;

    let promptBody = `Evalúa a ${isEmployee ? 'la persona empleada' : 'la persona aspirante'} llamada **${person.name}** para el puesto de **${position}**.\n`;
    promptBody += `Se realizó esta evaluación bajo un nivel de rigor: **${mode}**.\n`;
    promptBody += `IMPORTANTE: El nivel de rigor es el contexto clave para tu análisis. Un rigor 'Bajo' significa que las expectativas eran menores, por lo que una puntuación alta (ej. 9 o 10) es excepcionalmente buena y debe ser destacada como tal. Un rigor 'Riguroso' significa que se aplicaron los estándares más altos, por lo que las puntuaciones deben interpretarse estrictamente. Ajusta el tono y las conclusiones de tu retroalimentación en función de este nivel de rigor.\n\n`;
    promptBody += `La escala de evaluación es de 1 a 10. Las puntuaciones se interpretan en rangos: **Bajo (1-3)**, **Medio (4-7)** y **Alto (8-10)**.\n`;
    promptBody += `Al analizar cada puntuación, considera no solo el rango en el que cae, sino también su posición dentro de ese rango. Por ejemplo, una puntuación de 7 está en el extremo superior del rango 'Medio', casi alcanzando 'Alto', mientras que un 4 está en el extremo inferior. Del mismo modo, un 3 es un 'Bajo' sólido, mientras que un 1 es una señal de alerta importante. Refleja este nivel de matiz en tu retroalimentación.\n`
    promptBody += `Cada característica tiene un 'peso' de importancia que va de 0 a 1, donde 1 es lo más importante.\n\n`;

    criteria.forEach(factor => {
      promptBody += `**Factor: ${factor.name}**\n`;
      factor.characteristics.forEach(char => {
        const score = scoresMap.get(char.id) ?? 'N/A';
        promptBody += `- Característica: "${char.name}" (Peso: ${char.weight.toFixed(1)}): **Puntuación: ${score}**\n`;
      });
      promptBody += '\n';
    });

    promptBody += `Basado en esta evaluación, por favor proporciona una retroalimentación detallada y constructiva. La respuesta debe ser profesional y útil para la toma de decisiones. Estructura la respuesta en formato Markdown con los siguientes encabezados: ### Resumen General, ### Fortalezas Clave, y ### Áreas de Mejora. Sé específico en tus recomendaciones.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptBody,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error al generar feedback con Gemini API:", error);
    return "Error: No se pudo generar la retroalimentación. Por favor, revisa la configuración de la API y vuelve a intentarlo.";
  }
};

export const analyzeFlightRisk = async (
  employeeData: {
    tenureMonths: number;
    evaluationScores: number[]; // Most recent first
    absencesLast90Days: number;
    latesLast90Days: number;
  }
): Promise<{ riskScore: number; summary: string }> => {
  // Fix: Initialize the client here to prevent a crash on app load
  // when `process.env` is not available at the module's top level.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `
      Actúa como un analista experto en RRHH especializado en retención de talento.
      Analiza los siguientes datos de una persona empleada para predecir su riesgo de fuga (flight risk).

      DATOS:
      - Antigüedad: ${employeeData.tenureMonths} meses.
      - Historial de últimas evaluaciones (la más reciente primero): [${employeeData.evaluationScores.join(', ')}].
      - Ausencias en los últimos 90 días: ${employeeData.absencesLast90Days}.
      - Atrasos en los últimos 90 días: ${employeeData.latesLast90Days}.

      CONTEXTO PARA TU ANÁLISIS:
      1.  **Tendencia de Evaluación:** Una tendencia a la baja en las puntuaciones es una señal de alerta muy fuerte. Puntuaciones consistentemente bajas también son un riesgo.
      2.  **Asistencia:** Un número elevado de ausencias o atrasos puede indicar desmotivación o problemas personales que afectan el trabajo. Considera más de 3 ausencias o 5 atrasos en 90 días como un indicador a tener en cuenta.
      3.  **Antigüedad:** El riesgo suele ser alto en los primeros 18 meses (fase de adaptación) y después de varios años (3-5 años) si no hay crecimiento o cambios, lo que puede llevar al estancamiento.

      TAREA:
      Basado en los datos y el contexto, proporciona una evaluación concisa en formato JSON.
      El 'riskScore' debe ser un número de 0 (riesgo nulo) a 100 (riesgo inminente).
      El 'summary' debe ser un resumen de 2-3 frases explicando los factores clave que contribuyen al nivel de riesgo.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: {
              type: Type.NUMBER,
              description: "Un número de 0 a 100 que representa el riesgo de fuga."
            },
            summary: {
              type: Type.STRING,
              description: "Un resumen breve explicando los factores de riesgo."
            }
          }
        }
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result;

  } catch (error) {
    console.error("Error al analizar el riesgo de fuga con Gemini API:", error);
    return {
      riskScore: -1, // Indicate an error
      summary: "No se pudo generar el análisis de riesgo debido a un error en la API."
    };
  }
};