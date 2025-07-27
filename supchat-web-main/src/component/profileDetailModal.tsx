// React component profileDetailModal.tsx
interface modalProps {
  isOpen: boolean;
  onClose: () => void;
  imageURL: string;
  name: string;
  email: string;
}

const ProfileDetailModal = ({
  isOpen,
  onClose,
  imageURL,
  name,
  email,
}: modalProps) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay z-150">
      <div className="modal-content flex flex-col gap-2 w-[350px] items-center">
        <div className="w-20 h-20 rounded-[50px] overflow-hidden relative">
          <img src={imageURL} />
        </div>

        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={name}
          placeholder="Enter name"
          required
        />
        <input
          type="email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={email}
          // onChange={(e) => {}}
          placeholder="Enter email"
          required
        />

        <button
          type="button"
          onClick={() => {
            onClose();
          }}
          className="px-4 sm:px-6 bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ProfileDetailModal;
