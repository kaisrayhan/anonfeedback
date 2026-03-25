export interface Employee {
  id: string;
  name: string;
  designation: string;
  image_url: string;
  department?: string;
  created_at: string;
}

export interface Feedback {
  id: string;
  employee_id: string;
  message: string;
  created_at: string;
}
