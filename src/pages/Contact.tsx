import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '../components/Button';
import { useState } from 'react';
import type React from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setFormData({ firstName: '', lastName: '', email: '', phone: '', message: '' });
        setTimeout(() => setSubmitted(false), 4000);
      }
    } catch (err) {
      alert('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h1 className="mb-6 text-4xl font-bold">Get in Touch</h1>
            <p className="mb-12 text-lg text-zinc-500">
              Have questions about a project or want to list your development? Our team is here to help.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="mr-4 rounded-full bg-zinc-100 p-3">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Email Us</h3>
                  <p className="text-zinc-500">operationslivin@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 rounded-full bg-zinc-100 p-3">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Call Us</h3>
                  <p className="text-zinc-500"> +20 150 108 7033</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="mr-4 rounded-full bg-zinc-100 p-3">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">Visit Us</h3>
                  <p className="text-zinc-500">18 ABBAS ELAKKAD, Nacr City, Cairo</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-3xl bg-white p-8 shadow-xl border border-zinc-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitted && (
                <div className="rounded-xl bg-green-50 p-4 text-green-800">
                  Thank you! Your message has been sent successfully.
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Phone (Optional)</label>
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Message</label>
                <textarea 
                  rows={6} 
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 p-3 focus:border-black focus:outline-none" 
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
