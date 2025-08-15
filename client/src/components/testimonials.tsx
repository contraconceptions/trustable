import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import testimonialBgImage from "@assets/generated_images/Testimonial_background_graphic_3620a843.png";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Gaming Community Manager",
    server: "Elite Gamers Hub",
    rating: 5,
    text: "GamerRating Bot transformed our community. We can instantly identify trustworthy players and the cross-server reputation system means no one can escape their history. Essential for any serious gaming server."
  },
  {
    name: "Sarah Martinez",
    role: "Discord Server Owner",
    server: "Competitive League",
    rating: 5,
    text: "The real-time dashboard gives us incredible insights into community health. The authentication system lets our members track their own progress while maintaining privacy. Absolutely brilliant!"
  },
  {
    name: "Mike Johnson",
    role: "Esports Team Captain",
    server: "Pro Gamers Alliance",
    rating: 5,
    text: "Finding reliable teammates was always a challenge until we got GamerRating Bot. The interactive rating system and detailed analytics help us build better teams and maintain community standards."
  }
];

export function Testimonials() {
  return (
    <Card className="bg-discord-dark border-discord-border p-6 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          backgroundImage: `url(${testimonialBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-discord-text mb-2">Trusted by Gaming Communities</h2>
          <p className="text-discord-muted">See what Discord server owners and managers say about GamerRating Bot</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-discord-darker/80 backdrop-blur-sm border border-discord-border rounded-lg p-4">
              <div className="flex items-center mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-discord-text text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
              <div className="border-t border-discord-border pt-3">
                <p className="text-discord-text font-semibold text-sm">{testimonial.name}</p>
                <p className="text-discord-muted text-xs">{testimonial.role}</p>
                <p className="text-discord-blue text-xs">{testimonial.server}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
            <p className="text-discord-text font-medium mb-2">Join 500+ Discord Communities</p>
            <p className="text-discord-muted text-sm">Building trust and reputation across the Discord gaming ecosystem</p>
          </div>
        </div>
      </div>
    </Card>
  );
}