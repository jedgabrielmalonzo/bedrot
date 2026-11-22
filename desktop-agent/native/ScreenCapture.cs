using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Windows.Forms;

namespace DeskRemote
{
    class ScreenCapture
    {
        static void Main(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("ERROR: Output path required");
                return;
            }

            string outputPath = args[0];
            int quality = 70;
            if (args.Length >= 2)
            {
                int.TryParse(args[1], out quality);
            }

            try
            {
                Rectangle bounds = Screen.PrimaryScreen.Bounds;
                using (Bitmap bmp = new Bitmap(bounds.Width, bounds.Height))
                {
                    using (Graphics g = Graphics.FromImage(bmp))
                    {
                        g.CopyFromScreen(bounds.Location, Point.Empty, bounds.Size);
                    }

                    ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
                    System.Drawing.Imaging.Encoder myEncoder = System.Drawing.Imaging.Encoder.Quality;
                    EncoderParameters myEncoderParameters = new EncoderParameters(1);
                    EncoderParameter myEncoderParameter = new EncoderParameter(myEncoder, (long)quality);
                    myEncoderParameters.Param[0] = myEncoderParameter;

                    bmp.Save(outputPath, jpgEncoder, myEncoderParameters);
                }

                Console.WriteLine(string.Format("{0}|{1}", bounds.Width, bounds.Height));
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR: " + ex.Message);
            }
        }

        private static ImageCodecInfo GetEncoder(ImageFormat format)
        {
            ImageCodecInfo[] codecs = ImageCodecInfo.GetImageEncoders();
            foreach (ImageCodecInfo codec in codecs)
            {
                if (codec.FormatID == format.Guid)
                {
                    return codec;
                }
            }
            return null;
        }
    }
}
