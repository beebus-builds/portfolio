export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  project: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "Bibash shipped our election platform in a semester timeline and it held up under real voting days. The encryption write-up alone was worth it.",
    name: "Dr. Asha Rai",
    role: "Department coordinator",
    project: "iVote",
  },
  {
    quote:
      "He listens first, then builds. The pharmacy search went live and patients finally stopped calling us for directions.",
    name: "Rajesh Shrestha",
    role: "Pharmacy network operator",
    project: "Pharma Connect",
  },
  {
    quote:
      "Our WordPress theme survived two traffic spikes on matchdays without a hiccup. Exactly the calm kind of developer you want on a fan site.",
    name: "Mateo Alvarez",
    role: "Fan site manager",
    project: "Nico Paz",
  },
];
