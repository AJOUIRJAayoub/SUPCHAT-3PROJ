// supchat-web-main/src/component/profileModal.tsx
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";
import type { RootState } from "../redux/types";
import { useUpdateUserMutation } from "../redux/apis/auth";
import { uploadToCloudinary } from "../../script/cloudinaryUpload";
import { setUser } from "../redux/slices/user";
import { toast } from "react-toastify";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ModalProps) => {
  const [updateUser, { isLoading, isError }] = useUpdateUserMutation();
  const user = useSelector((state: RootState) => state.user.user);
  const [name, setName] = useState<string>(user?.name || "");
  const [imageFile, setIMageFile] = useState<File | null>(null);
  const [isLoading2, setIsLoading2] = useState(false);
  const dispatch = useDispatch();
  const [previewImage, setPreviewImage] = useState(
    user?.profilePicture || "https://i.pravatar.cc/40"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Picked file:", file);
      setIMageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const saveUpdatedInfo = async () => {
    if (!user) {
      toast("User not logged in");
      return;
    }

    try {
      setIsLoading2(true);
      let profileURL = user.profilePicture;
      
      if (imageFile) {
        const uploadedUrl = await uploadToCloudinary(imageFile);
        if (uploadedUrl) {
          profileURL = uploadedUrl;
        }
      }
      
      const response = await updateUser({
        profilePicture: profileURL,
        name: name,
      }).unwrap();
      
      if (response?.data?.user) {
        dispatch(
          setUser({
            name: response.data.user.name,
            profilePicture: response.data.user.profilePicture,
            id: user.id,
            _id: user._id,
            email: user.email,
            token: user.token,
          })
        );
      }
      
      onClose();
      setIsLoading2(false);
      toast("Updated");
    } catch (e: any) {
      setIsLoading2(false);
      toast(e?.data?.message || "Error occurred updating profile");
      console.log("error occurred", e);
    }
  };

  useEffect(() => {
    if (isError) {
      toast("Error occurred updating profile");
    }
  }, [isError]);

  useEffect(() => {
    // Update name when user changes
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay z-150">
      <div className="modal-content flex flex-col gap-2 w-[350px] items-center">
        <div className="w-20 h-20 rounded-[50px] overflow-hidden relative">
          <img 
            src={previewImage} 
            alt="Profile preview"
            className="w-full h-full object-cover"
          />
        </div>
        <button
          type="button"
          onClick={openGallery}
          className="px-4 sm:px-6 bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm"
        >
          Edit Picture
        </button>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={handleImagePick}
          className="hidden"
        />
        <input
          type="text"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          placeholder="Enter name"
          required
        />
        <input
          type="email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          value={user?.email || ""}
          readOnly
          placeholder="Enter email"
          required
        />
        <button
          type="button"
          onClick={saveUpdatedInfo}
          disabled={isLoading || isLoading2}
          className={`px-4 sm:px-6 ${
            isLoading || isLoading2 ? "bg-gray-300" : "bg-primary"
          } text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm w-full`}
        >
          {isLoading || isLoading2 ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 sm:px-6 bg-primary text-white py-2 rounded-lg hover:bg-blue-600 transition text-sm w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;