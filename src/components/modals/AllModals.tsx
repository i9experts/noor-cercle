import Modal, { FormGroup, FormInput, FormSelect, FormTextarea, FormRow } from "@/components/shared/Modal";

export function EnrollModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Enroll New Student" subtitle="Register a child into a Noor Circle · All fields required">
      <FormRow>
        <FormGroup label="Full Name" required><FormInput placeholder="Child's full name" /></FormGroup>
        <FormGroup label="Date of Birth" required><FormInput type="date" /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Neighbourhood" required>
          <FormSelect><option>Gulshan-e-Iqbal</option><option>DHA</option><option>Clifton</option><option>Nazimabad</option></FormSelect>
        </FormGroup>
        <FormGroup label="Assign Circle" required>
          <FormSelect><option>Gulshan Circle 1</option><option>DHA Circle 1</option><option>Clifton Circle 1</option></FormSelect>
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Parent/Guardian Name" required><FormInput placeholder="Parent's full name" /></FormGroup>
        <FormGroup label="Parent Phone" required><FormInput placeholder="+92 300 0000000" /></FormGroup>
      </FormRow>
      <FormGroup label="Parent WhatsApp (if different)"><FormInput placeholder="+92 300 0000000" /></FormGroup>
      <FormGroup label="Special Notes for Murabbi"><FormTextarea placeholder="Any relevant background, special needs, or notes…" /></FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1">Enroll Student</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

export function NewCircleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Create New Circle" subtitle="Set up a new Noor Circle in your neighbourhood">
      <FormRow>
        <FormGroup label="Circle Name" required><FormInput placeholder="e.g. Gulshan Circle 2" /></FormGroup>
        <FormGroup label="Neighbourhood" required>
          <FormSelect><option>Gulshan-e-Iqbal</option><option>DHA</option><option>Clifton</option><option>Nazimabad</option></FormSelect>
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Assign Murabbi" required>
          <FormSelect><option>Umm Aisha</option><option>Br. Hassan</option><option>Sr. Maryam</option><option>Br. Ibrahim</option></FormSelect>
        </FormGroup>
        <FormGroup label="Venue / Location" required><FormInput placeholder="Address or venue name" /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Session Day" required>
          <FormSelect><option>Friday</option><option>Saturday</option><option>Sunday</option></FormSelect>
        </FormGroup>
        <FormGroup label="Session Time" required><FormInput type="time" value="15:00" /></FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Start Date" required><FormInput type="date" /></FormGroup>
        <FormGroup label="Max Students"><FormInput type="number" value="10" /></FormGroup>
      </FormRow>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1">Create Circle</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

export function AwardPointsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Award Noor Points" subtitle="Recognise character, service, or consistency">
      <FormGroup label="Student" required>
        <FormSelect><option>Nadia Tariq — Gulshan Circle 1</option><option>Zaid Ahmad — Gulshan Circle 1</option><option>Omar Farooq — Clifton Circle 1</option></FormSelect>
      </FormGroup>
      <FormGroup label="Award Type" required>
        <FormSelect>
          <option>🌟 Noor Star (50 pts) — Exemplary character</option>
          <option>📿 Circle Champion (100 pts) — 100% attendance</option>
          <option>🤝 Sadaqah Hero (75 pts) — Community service</option>
          <option>📖 Knowledge Seeker (25 pts) — Outstanding question</option>
          <option>💛 Kindness Award (30 pts) — Act of generosity</option>
          <option>🦁 Courage Award (40 pts) — Moral courage shown</option>
        </FormSelect>
      </FormGroup>
      <FormGroup label="Reason (shown to student)" required><FormTextarea placeholder="Describe the specific act that earned this award…" /></FormGroup>
      <FormGroup label="Notify Parent?">
        <FormSelect><option>Yes — send WhatsApp message</option><option>No</option></FormSelect>
      </FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-gold flex-1">Award Points</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

export function AddMurabbiModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Add New Murabbi" subtitle="Register a Murabbi candidate for Tier 1 training">
      <FormRow>
        <FormGroup label="Full Name" required><FormInput placeholder="Full name" /></FormGroup>
        <FormGroup label="Gender" required>
          <FormSelect><option>Male</option><option>Female</option></FormSelect>
        </FormGroup>
      </FormRow>
      <FormRow>
        <FormGroup label="Phone" required><FormInput placeholder="+92 300 0000000" /></FormGroup>
        <FormGroup label="Neighbourhood" required>
          <FormSelect><option>Gulshan-e-Iqbal</option><option>DHA</option><option>Clifton</option><option>Nazimabad</option></FormSelect>
        </FormGroup>
      </FormRow>
      <FormGroup label="Background / Occupation"><FormInput placeholder="Teacher, homemaker, student, professional…" /></FormGroup>
      <FormGroup label="Why they want to become a Murabbi"><FormTextarea placeholder="Brief notes from the conversation…" /></FormGroup>
      <FormGroup label="Training Batch" required>
        <FormSelect><option>Batch 3 — 20–21 April 2025</option><option>Batch 4 — TBD</option></FormSelect>
      </FormGroup>
      <div className="flex gap-2.5 mt-2">
        <button className="btn-primary flex-1">Register Candidate</button>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}
